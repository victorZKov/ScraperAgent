using System.Globalization;
using System.Text.RegularExpressions;
using ScraperAgent.Configuration;
using ScraperAgent.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace ScraperAgent.Services;

public class TweetScraperService : ITweetScraperService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TweetScraperService> _logger;
    private readonly IOptions<ExpertAccountsOptions> _expertOptions;
    private static readonly Regex CashTagRegex = new(@"\$([A-Z]{1,5})\b", RegexOptions.Compiled);
    private static readonly Regex HashtagRegex = new(@"#(\w+)", RegexOptions.Compiled);
    private const string TwitterDateFormat = "ddd MMM dd HH:mm:ss +0000 yyyy";
    private const int MaxRetries = 2;
    private const int BaseDelayMs = 3000; // 3s between requests
    private const int RetryBaseDelayMs = 10000; // 10s initial retry delay
    private const int ScrapingConcurrency = 3; // Parallel scrapers (rate-limit safe)

    public TweetScraperService(
        IHttpClientFactory httpClientFactory,
        ILogger<TweetScraperService> logger,
        IOptions<ExpertAccountsOptions> expertOptions)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _expertOptions = expertOptions;
    }

    public Task<TweetCollection> GetExpertTweetsAsync(int maxTweetsPerUser = 50, int hoursBack = 72)
    {
        var experts = DefaultExpertAccounts.GetFromOptions(_expertOptions);
        return GetExpertTweetsAsync(experts, maxTweetsPerUser, hoursBack);
    }

    public async Task<TweetCollection> GetExpertTweetsAsync(List<ExpertAccount> experts, int maxTweetsPerUser = 50, int hoursBack = 72)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-hoursBack);
        var allTweets = new List<Tweet>();
        var failedExperts = new List<string>();

        _logger.LogInformation("Scraping tweets from {ExpertCount} experts (last {HoursBack}h, concurrency: {Concurrency})",
            experts.Count, hoursBack, ScrapingConcurrency);

        // Process in parallel with controlled concurrency to avoid rate limiting
        var semaphore = new SemaphoreSlim(ScrapingConcurrency);
        var tasks = experts.Select(async expert =>
        {
            await semaphore.WaitAsync();
            try
            {
                // Stagger requests to spread load across time
                await Task.Delay(BaseDelayMs);
                var tweets = await ScrapeWithRetryAsync(expert, maxTweetsPerUser, cutoffTime);
                return (expert, tweets, error: (string?)null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to scrape @{Handle}", expert.Handle);
                return (expert, tweets: new List<Tweet>(), error: ex.Message);
            }
            finally
            {
                semaphore.Release();
            }
        });
        var results = await Task.WhenAll(tasks);

        foreach (var (expert, tweets, error) in results)
        {
            if (error != null)
            {
                failedExperts.Add(expert.Handle);
            }
            else
            {
                allTweets.AddRange(tweets);
                _logger.LogInformation("@{Handle}: {Count} tweets scraped", expert.Handle, tweets.Count);
            }
        }

        var collection = new TweetCollection
        {
            Tweets = allTweets.OrderByDescending(t => t.CreatedAt).ToList(),
            ExpertsQueried = experts,
            FailedExperts = failedExperts,
            CollectedAt = DateTime.UtcNow,
            DataSource = "syndication"
        };

        _logger.LogInformation("Scraping complete: {TweetCount} tweets, {FailureCount} failures",
            collection.TotalTweetsCollected, failedExperts.Count);

        return collection;
    }

    private async Task<List<Tweet>> ScrapeWithRetryAsync(ExpertAccount expert, int maxTweets, DateTime cutoffTime)
    {
        for (var attempt = 0; attempt < MaxRetries; attempt++)
        {
            var tweets = await ScrapeUserTweetsAsync(expert, maxTweets, cutoffTime);
            if (tweets != null) return tweets; // null means rate-limited, retry

            // Exponential backoff: 10s, 20s
            var delayMs = RetryBaseDelayMs * (attempt + 1);
            _logger.LogWarning("Rate limited for @{Handle}, retrying in {Delay}s (attempt {Attempt}/{Max})",
                expert.Handle, delayMs / 1000, attempt + 1, MaxRetries);
            await Task.Delay(delayMs);
        }

        _logger.LogWarning("All retries exhausted for @{Handle}", expert.Handle);
        return new List<Tweet>();
    }

    private async Task<List<Tweet>?> ScrapeUserTweetsAsync(ExpertAccount expert, int maxTweets, DateTime cutoffTime)
    {
        var client = _httpClientFactory.CreateClient("TwitterScraper");

        var url = $"https://syndication.twitter.com/srv/timeline-profile/screen-name/{expert.Handle}";
        var response = await client.GetAsync(url);

        if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            _logger.LogWarning("Rate limited (429) for @{Handle}", expert.Handle);
            return null; // Signal to retry
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Syndication API returned {StatusCode} for @{Handle}", response.StatusCode, expert.Handle);
            return new List<Tweet>();
        }

        var html = await response.Content.ReadAsStringAsync();
        _logger.LogInformation("Got {Length} bytes from syndication for @{Handle}", html.Length, expert.Handle);

        var tweets = ParseNextDataJson(html, expert, maxTweets, cutoffTime);

        if (tweets.Count > 0)
        {
            _logger.LogInformation("Parsed {Count} tweets for @{Handle}", tweets.Count, expert.Handle);
        }
        else
        {
            _logger.LogWarning("No tweets parsed from {Length} bytes for @{Handle}", html.Length, expert.Handle);
        }

        return tweets;
    }

    private List<Tweet> ParseNextDataJson(string html, ExpertAccount expert, int maxTweets, DateTime cutoffTime)
    {
        var tweets = new List<Tweet>();

        try
        {
            // Extract __NEXT_DATA__ JSON from the HTML
            var marker = "\"props\":";
            var startIdx = html.IndexOf("{" + marker, StringComparison.Ordinal);
            if (startIdx == -1)
            {
                // Try finding the script tag content directly
                var scriptStart = html.IndexOf("__NEXT_DATA__", StringComparison.Ordinal);
                if (scriptStart == -1) return tweets;

                startIdx = html.IndexOf('{', scriptStart);
                if (startIdx == -1) return tweets;
            }

            var endIdx = html.IndexOf("</script>", startIdx, StringComparison.Ordinal);
            if (endIdx == -1) return tweets;

            var jsonStr = html[startIdx..endIdx];
            var root = JObject.Parse(jsonStr);

            var entries = root.SelectToken("props.pageProps.timeline.entries") as JArray;
            if (entries == null) return tweets;

            foreach (var entry in entries)
            {
                if (entry["type"]?.ToString() != "tweet") continue;

                var tweetData = entry.SelectToken("content.tweet");
                if (tweetData == null) continue;

                var fullText = tweetData["full_text"]?.ToString() ?? tweetData["text"]?.ToString();
                if (string.IsNullOrWhiteSpace(fullText)) continue;

                var createdAtStr = tweetData["created_at"]?.ToString();
                var createdAt = ParseTwitterDate(createdAtStr);

                // Note: syndication API may return cached data from various dates
                // We take all available tweets and let the AI handle relevance

                var tweetId = tweetData["id_str"]?.ToString() ?? $"syn_{Guid.NewGuid():N}";
                var screenName = tweetData.SelectToken("user.screen_name")?.ToString() ?? expert.Handle;
                var displayName = tweetData.SelectToken("user.name")?.ToString() ?? expert.DisplayName;

                // Extract hashtags and cashtags from entities or text
                var hashtags = new List<string>();
                var cashTags = new List<string>();

                var entityHashtags = tweetData.SelectToken("entities.hashtags") as JArray;
                if (entityHashtags != null)
                {
                    foreach (var h in entityHashtags)
                    {
                        var tag = h["text"]?.ToString();
                        if (!string.IsNullOrEmpty(tag))
                            hashtags.Add($"#{tag}");
                    }
                }

                var entitySymbols = tweetData.SelectToken("entities.symbols") as JArray;
                if (entitySymbols != null)
                {
                    foreach (var s in entitySymbols)
                    {
                        var tag = s["text"]?.ToString();
                        if (!string.IsNullOrEmpty(tag))
                            cashTags.Add($"${tag}");
                    }
                }

                // Fallback: extract from text if entities are empty
                if (hashtags.Count == 0)
                    hashtags = HashtagRegex.Matches(fullText).Select(m => "#" + m.Groups[1].Value).Distinct().ToList();
                if (cashTags.Count == 0)
                    cashTags = CashTagRegex.Matches(fullText).Select(m => "$" + m.Groups[1].Value).Distinct().ToList();

                tweets.Add(new Tweet
                {
                    Id = tweetId,
                    AuthorHandle = screenName,
                    AuthorDisplayName = displayName,
                    Text = fullText,
                    CreatedAt = createdAt,
                    LikeCount = tweetData["favorite_count"]?.Value<int>() ?? 0,
                    RetweetCount = tweetData["retweet_count"]?.Value<int>() ?? 0,
                    ReplyCount = tweetData["reply_count"]?.Value<int>() ?? 0,
                    Hashtags = hashtags,
                    CashTags = cashTags,
                    Url = $"https://x.com/{screenName}/status/{tweetId}"
                });

                if (tweets.Count >= maxTweets) break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing __NEXT_DATA__ JSON for @{Handle}", expert.Handle);
        }

        return tweets;
    }

    private static DateTime ParseTwitterDate(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr)) return DateTime.UtcNow;

        if (DateTime.TryParseExact(dateStr, TwitterDateFormat,
                CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed))
        {
            return parsed.ToUniversalTime();
        }

        return DateTime.UtcNow;
    }
}
