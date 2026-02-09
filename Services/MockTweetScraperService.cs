using ScraperAgent.Configuration;
using ScraperAgent.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ScraperAgent.Services;

public class MockTweetScraperService : ITweetScraperService
{
    private readonly ILogger<MockTweetScraperService> _logger;
    private readonly IOptions<ExpertAccountsOptions> _expertOptions;

    public MockTweetScraperService(ILogger<MockTweetScraperService> logger, IOptions<ExpertAccountsOptions> expertOptions)
    {
        _logger = logger;
        _expertOptions = expertOptions;
    }

    public Task<TweetCollection> GetExpertTweetsAsync(int maxTweetsPerUser = 50, int hoursBack = 72)
    {
        var experts = DefaultExpertAccounts.GetFromOptions(_expertOptions);
        return GetExpertTweetsAsync(experts, maxTweetsPerUser, hoursBack);
    }

    public Task<TweetCollection> GetExpertTweetsAsync(List<ExpertAccount> experts, int maxTweetsPerUser = 50, int hoursBack = 72)
    {
        _logger.LogInformation("Using MOCK tweet data for analysis");

        var now = DateTime.UtcNow;

        var tweets = new List<Tweet>
        {
            // Jim Cramer - TV Analyst (Bullish tech)
            new()
            {
                Id = "mock_001", AuthorHandle = "jimcramer", AuthorDisplayName = "Jim Cramer",
                Text = "I'm telling you, $NVDA is the gift that keeps on giving. AI spending is NOT slowing down. Every major tech company is doubling their capex. This is the infrastructure buildout of our generation. BUY BUY BUY!",
                CreatedAt = now.AddHours(-4), LikeCount = 12500, RetweetCount = 3200, ReplyCount = 890,
                CashTags = new() { "$NVDA" }, Hashtags = new() { "#AI", "#Tech" },
                Url = "https://x.com/jimcramer/status/mock_001"
            },
            new()
            {
                Id = "mock_002", AuthorHandle = "jimcramer", AuthorDisplayName = "Jim Cramer",
                Text = "$AAPL earnings next week. I think Cook has another rabbit in the hat. Services revenue will surprise to the upside. Don't sell ahead of earnings.",
                CreatedAt = now.AddHours(-18), LikeCount = 8900, RetweetCount = 2100, ReplyCount = 650,
                CashTags = new() { "$AAPL" }, Hashtags = new() { "#Earnings" },
                Url = "https://x.com/jimcramer/status/mock_002"
            },

            // First Squawk - Breaking News
            new()
            {
                Id = "mock_003", AuthorHandle = "FirstSquawk", AuthorDisplayName = "First Squawk",
                Text = "BREAKING: Fed Chair Powell says 'we are in no hurry to cut rates' - economy remains strong, labor market solid. Markets pulling back on hawkish tone.",
                CreatedAt = now.AddHours(-2), LikeCount = 45000, RetweetCount = 18000, ReplyCount = 3200,
                CashTags = new() { "$SPY", "$QQQ" }, Hashtags = new() { "#Fed", "#RateCut" },
                Url = "https://x.com/FirstSquawk/status/mock_003"
            },
            new()
            {
                Id = "mock_004", AuthorHandle = "FirstSquawk", AuthorDisplayName = "First Squawk",
                Text = "US INITIAL JOBLESS CLAIMS: 215K vs 220K expected. Continuing claims at 1.87M. Labor market remains tight.",
                CreatedAt = now.AddHours(-8), LikeCount = 22000, RetweetCount = 8500, ReplyCount = 1100,
                CashTags = new(), Hashtags = new() { "#Jobs", "#Economy" },
                Url = "https://x.com/FirstSquawk/status/mock_004"
            },

            // Walter Bloomberg - Breaking News
            new()
            {
                Id = "mock_005", AuthorHandle = "DeItaone", AuthorDisplayName = "Walter Bloomberg",
                Text = "MICROSOFT $MSFT to invest $80 billion in AI data centers in fiscal 2025, up from previous $50B guidance. Stock +3% premarket.",
                CreatedAt = now.AddHours(-6), LikeCount = 35000, RetweetCount = 14000, ReplyCount = 2800,
                CashTags = new() { "$MSFT" }, Hashtags = new() { "#AI" },
                Url = "https://x.com/DeItaone/status/mock_005"
            },
            new()
            {
                Id = "mock_006", AuthorHandle = "DeItaone", AuthorDisplayName = "Walter Bloomberg",
                Text = "OIL: WTI crude drops below $72 as OPEC+ signals potential production increase. Energy stocks under pressure. $XLE $CVX $XOM",
                CreatedAt = now.AddHours(-10), LikeCount = 18000, RetweetCount = 6500, ReplyCount = 900,
                CashTags = new() { "$XLE", "$CVX", "$XOM" }, Hashtags = new() { "#Oil", "#OPEC" },
                Url = "https://x.com/DeItaone/status/mock_006"
            },

            // Mohamed El-Erian - Macro Strategist
            new()
            {
                Id = "mock_007", AuthorHandle = "elerianm", AuthorDisplayName = "Mohamed El-Erian",
                Text = "The market is pricing in only one rate cut this year. I believe the Fed will be forced to act by Q3 as economic data softens. The disconnect between equity valuations and bond yields is unsustainable. Be cautious with duration.",
                CreatedAt = now.AddHours(-12), LikeCount = 28000, RetweetCount = 9200, ReplyCount = 1500,
                CashTags = new() { "$TLT" }, Hashtags = new() { "#Fed", "#Bonds", "#Macro" },
                Url = "https://x.com/elerianm/status/mock_007"
            },
            new()
            {
                Id = "mock_008", AuthorHandle = "elerianm", AuthorDisplayName = "Mohamed El-Erian",
                Text = "China's stimulus measures are starting to gain traction. PMI data improving. EM could be the surprise trade of 2026. Watch $EEM and $FXI closely.",
                CreatedAt = now.AddHours(-28), LikeCount = 19000, RetweetCount = 6800, ReplyCount = 980,
                CashTags = new() { "$EEM", "$FXI" }, Hashtags = new() { "#China", "#EmergingMarkets" },
                Url = "https://x.com/elerianm/status/mock_008"
            },

            // Cathie Wood - Fund Manager (Growth/Innovation)
            new()
            {
                Id = "mock_009", AuthorHandle = "CathieDWood", AuthorDisplayName = "Cathie Wood",
                Text = "AI is deflationary. As costs come down, innovation will accelerate exponentially. $TSLA robotaxi launch will be the iPhone moment for autonomous driving. We see 5x upside from here over 5 years.",
                CreatedAt = now.AddHours(-15), LikeCount = 32000, RetweetCount = 11000, ReplyCount = 4500,
                CashTags = new() { "$TSLA" }, Hashtags = new() { "#AI", "#Innovation" },
                Url = "https://x.com/CathieDWood/status/mock_009"
            },
            new()
            {
                Id = "mock_010", AuthorHandle = "CathieDWood", AuthorDisplayName = "Cathie Wood",
                Text = "$COIN is positioned to benefit massively from crypto adoption. Bitcoin ETF inflows remain strong. We've been adding to our $COIN position on this pullback. Digital assets are not going away.",
                CreatedAt = now.AddHours(-36), LikeCount = 25000, RetweetCount = 8900, ReplyCount = 3200,
                CashTags = new() { "$COIN" }, Hashtags = new() { "#Crypto", "#Bitcoin" },
                Url = "https://x.com/CathieDWood/status/mock_010"
            },

            // Peter Schiff - Macro Strategist (Bear/Gold)
            new()
            {
                Id = "mock_011", AuthorHandle = "PeterSchiff", AuthorDisplayName = "Peter Schiff",
                Text = "The stock market is a giant bubble. $SPY at all-time highs while consumer debt is at record levels. This will not end well. Gold $GLD is the only safe haven. The dollar is being debased.",
                CreatedAt = now.AddHours(-5), LikeCount = 15000, RetweetCount = 5500, ReplyCount = 2800,
                CashTags = new() { "$SPY", "$GLD" }, Hashtags = new() { "#Gold", "#Inflation" },
                Url = "https://x.com/PeterSchiff/status/mock_011"
            },
            new()
            {
                Id = "mock_012", AuthorHandle = "PeterSchiff", AuthorDisplayName = "Peter Schiff",
                Text = "National debt just crossed $37 trillion. Interest payments now exceed defense spending. This is fiscal insanity. Buy gold, sell bonds. $GLD $TLT",
                CreatedAt = now.AddHours(-22), LikeCount = 21000, RetweetCount = 7800, ReplyCount = 3100,
                CashTags = new() { "$GLD", "$TLT" }, Hashtags = new() { "#Debt", "#Gold" },
                Url = "https://x.com/PeterSchiff/status/mock_012"
            },

            // Lisa Abramowicz - TV Analyst
            new()
            {
                Id = "mock_013", AuthorHandle = "lisaabramowicz1", AuthorDisplayName = "Lisa Abramowicz",
                Text = "Credit spreads remain historically tight despite rising rates. This suggests the bond market sees no recession risk near-term. But the complacency is concerning. Any shock could trigger rapid widening.",
                CreatedAt = now.AddHours(-9), LikeCount = 11000, RetweetCount = 3800, ReplyCount = 620,
                CashTags = new() { "$HYG", "$LQD" }, Hashtags = new() { "#Credit", "#Bonds" },
                Url = "https://x.com/lisaabramowicz1/status/mock_013"
            },
            new()
            {
                Id = "mock_014", AuthorHandle = "lisaabramowicz1", AuthorDisplayName = "Lisa Abramowicz",
                Text = "Earnings season so far: 78% of S&P 500 companies beating EPS estimates. Revenue beats at 65%. Tech and healthcare leading. Margins expanding despite wage pressures. $SPY $QQQ",
                CreatedAt = now.AddHours(-20), LikeCount = 14000, RetweetCount = 4500, ReplyCount = 780,
                CashTags = new() { "$SPY", "$QQQ" }, Hashtags = new() { "#Earnings" },
                Url = "https://x.com/lisaabramowicz1/status/mock_014"
            },

            // Carl Quintanilla - TV Analyst
            new()
            {
                Id = "mock_015", AuthorHandle = "carlquintanilla", AuthorDisplayName = "Carl Quintanilla",
                Text = "Semiconductor stocks rallying hard today. $SMH up 2.5%. TSMC raised revenue guidance citing 'insatiable AI demand'. $TSM $AVGO $AMD all at or near highs.",
                CreatedAt = now.AddHours(-3), LikeCount = 9800, RetweetCount = 3100, ReplyCount = 450,
                CashTags = new() { "$SMH", "$TSM", "$AVGO", "$AMD" }, Hashtags = new() { "#Semiconductors" },
                Url = "https://x.com/carlquintanilla/status/mock_015"
            },

            // Bloomberg Markets
            new()
            {
                Id = "mock_016", AuthorHandle = "markets", AuthorDisplayName = "Bloomberg Markets",
                Text = "BREAKING: US 10Y yield hits 4.65%, highest since October. Dollar strengthening across the board. Equity futures turning red. Rate-sensitive sectors leading losses.",
                CreatedAt = now.AddHours(-1), LikeCount = 38000, RetweetCount = 15000, ReplyCount = 2500,
                CashTags = new() { "$TNX" }, Hashtags = new() { "#Bonds", "#Yields" },
                Url = "https://x.com/markets/status/mock_016"
            },
            new()
            {
                Id = "mock_017", AuthorHandle = "markets", AuthorDisplayName = "Bloomberg Markets",
                Text = "European stocks close lower as ECB signals pause in rate cuts. DAX -0.8%, FTSE -0.5%. Auto stocks hit hard on tariff concerns. $EWG",
                CreatedAt = now.AddHours(-14), LikeCount = 16000, RetweetCount = 5200, ReplyCount = 800,
                CashTags = new() { "$EWG" }, Hashtags = new() { "#Europe", "#ECB" },
                Url = "https://x.com/markets/status/mock_017"
            },

            // Unusual Whales - Options Flow
            new()
            {
                Id = "mock_018", AuthorHandle = "unusual_whales", AuthorDisplayName = "Unusual Whales",
                Text = "Massive $NVDA call sweep: 10,000 contracts of March $950 calls bought for $12.5M. Someone is betting big on continued AI momentum. Current price: $890.",
                CreatedAt = now.AddHours(-7), LikeCount = 22000, RetweetCount = 8200, ReplyCount = 1900,
                CashTags = new() { "$NVDA" }, Hashtags = new() { "#Options", "#UnusualActivity" },
                Url = "https://x.com/unusual_whales/status/mock_018"
            },
            new()
            {
                Id = "mock_019", AuthorHandle = "unusual_whales", AuthorDisplayName = "Unusual Whales",
                Text = "Large $SPY put volume detected. 25,000 contracts of Feb $580 puts. Could be hedging or a directional bet ahead of next week's CPI data. Implied vol rising.",
                CreatedAt = now.AddHours(-11), LikeCount = 18500, RetweetCount = 6900, ReplyCount = 1400,
                CashTags = new() { "$SPY" }, Hashtags = new() { "#Options", "#CPI" },
                Url = "https://x.com/unusual_whales/status/mock_019"
            },

            // Additional tweets for depth
            new()
            {
                Id = "mock_020", AuthorHandle = "jimcramer", AuthorDisplayName = "Jim Cramer",
                Text = "Stay away from $BA until they fix the quality control issues. I know it looks cheap but cheap can get cheaper. Wait for the turnaround to be confirmed.",
                CreatedAt = now.AddHours(-30), LikeCount = 7200, RetweetCount = 1800, ReplyCount = 540,
                CashTags = new() { "$BA" }, Hashtags = new(),
                Url = "https://x.com/jimcramer/status/mock_020"
            },
            new()
            {
                Id = "mock_021", AuthorHandle = "elerianm", AuthorDisplayName = "Mohamed El-Erian",
                Text = "The concentration risk in $SPY is extreme. Top 7 stocks = 35% of the index. Any rotation out of mega-cap tech would cause significant index-level volatility. Diversification matters more than ever.",
                CreatedAt = now.AddHours(-40), LikeCount = 24000, RetweetCount = 8500, ReplyCount = 1200,
                CashTags = new() { "$SPY" }, Hashtags = new() { "#Concentration", "#Risk" },
                Url = "https://x.com/elerianm/status/mock_021"
            },
            new()
            {
                Id = "mock_022", AuthorHandle = "CathieDWood", AuthorDisplayName = "Cathie Wood",
                Text = "Genomics revolution is underway. $CRSP CRISPR therapies getting real-world traction. Healthcare innovation is the most underappreciated theme of 2026. We're overweight biotech.",
                CreatedAt = now.AddHours(-48), LikeCount = 19000, RetweetCount = 6200, ReplyCount = 2100,
                CashTags = new() { "$CRSP" }, Hashtags = new() { "#Biotech", "#Genomics" },
                Url = "https://x.com/CathieDWood/status/mock_022"
            },
            new()
            {
                Id = "mock_023", AuthorHandle = "FirstSquawk", AuthorDisplayName = "First Squawk",
                Text = "CHINA: PBoC cuts reserve requirement ratio by 50bps, injecting ~$140B in liquidity. Yuan weakening. US-listed China stocks $BABA $JD rallying premarket.",
                CreatedAt = now.AddHours(-16), LikeCount = 30000, RetweetCount = 12000, ReplyCount = 2000,
                CashTags = new() { "$BABA", "$JD" }, Hashtags = new() { "#China" },
                Url = "https://x.com/FirstSquawk/status/mock_023"
            },
            new()
            {
                Id = "mock_024", AuthorHandle = "PeterSchiff", AuthorDisplayName = "Peter Schiff",
                Text = "$BTC is not digital gold. It's digital tulips. When the music stops and liquidity dries up, crypto will crash 80%. Real assets - gold, silver, commodities - are the true hedge.",
                CreatedAt = now.AddHours(-38), LikeCount = 28000, RetweetCount = 9500, ReplyCount = 8200,
                CashTags = new() { "$BTC" }, Hashtags = new() { "#Bitcoin", "#Gold" },
                Url = "https://x.com/PeterSchiff/status/mock_024"
            },
            new()
            {
                Id = "mock_025", AuthorHandle = "unusual_whales", AuthorDisplayName = "Unusual Whales",
                Text = "Insider buying alert: $AMZN CFO bought $2.1M in shares at $198. Multiple directors also buying. Insiders tend to buy when they believe shares are undervalued.",
                CreatedAt = now.AddHours(-24), LikeCount = 26000, RetweetCount = 9800, ReplyCount = 1600,
                CashTags = new() { "$AMZN" }, Hashtags = new() { "#InsiderTrading" },
                Url = "https://x.com/unusual_whales/status/mock_025"
            },
        };

        // Fix AuthorDisplayName where DisplayName was used (mock typo simulation)
        foreach (var tweet in tweets)
        {
            if (string.IsNullOrEmpty(tweet.AuthorDisplayName))
            {
                var expert = experts.FirstOrDefault(e => e.Handle == tweet.AuthorHandle);
                tweet.AuthorDisplayName = expert?.DisplayName ?? tweet.AuthorHandle;
            }
        }

        var collection = new TweetCollection
        {
            Tweets = tweets,
            ExpertsQueried = experts,
            FailedExperts = new List<string>(),
            CollectedAt = now,
            DataSource = "mock"
        };

        _logger.LogInformation($"Mock data loaded: {collection.TotalTweetsCollected} tweets from {experts.Count} experts");

        return Task.FromResult(collection);
    }
}
