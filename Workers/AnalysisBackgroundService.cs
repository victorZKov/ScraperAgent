using System.Diagnostics;
using System.Threading.Channels;
using ScraperAgent.Models;
using ScraperAgent.Services;

namespace ScraperAgent.Workers;

public class AnalysisBackgroundService : BackgroundService
{
    private readonly Channel<AnalysisJobMessage> _channel;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IJobTrackingService _jobTracker;
    private readonly ILogger<AnalysisBackgroundService> _logger;

    public AnalysisBackgroundService(
        Channel<AnalysisJobMessage> channel,
        IServiceScopeFactory scopeFactory,
        IJobTrackingService jobTracker,
        ILogger<AnalysisBackgroundService> logger)
    {
        _channel = channel;
        _scopeFactory = scopeFactory;
        _jobTracker = jobTracker;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Analysis background worker started");

        await foreach (var message in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            var jobId = message.JobId;
            var domain = message.Domain;
            _logger.LogInformation("Worker picked up {Domain} job {JobId}", domain, jobId);
            _jobTracker.MarkRunning(jobId);

            try
            {
                var report = await RunAnalysisPipelineAsync(domain, stoppingToken);
                _jobTracker.MarkCompleted(jobId, report.Id);
                _logger.LogInformation("Job {JobId} completed. Report: {ReportId}", jobId, report.Id);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning("Job {JobId} cancelled due to shutdown", jobId);
                _jobTracker.MarkFailed(jobId, "Server shutting down");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job {JobId} failed", jobId);
                _jobTracker.MarkFailed(jobId, ex.Message);
            }
        }

        _logger.LogInformation("Analysis background worker stopped");
    }

    private async Task<MarketReport> RunAnalysisPipelineAsync(AnalysisDomain domain, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var tweetScraper = scope.ServiceProvider.GetRequiredService<ITweetScraperService>();
        var aiService = scope.ServiceProvider.GetRequiredService<IMarketAIService>();
        var marketDataService = scope.ServiceProvider.GetRequiredService<IMarketDataService>();
        var webSearchService = scope.ServiceProvider.GetRequiredService<IWebSearchService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IReportEmailService>();
        var storageService = scope.ServiceProvider.GetRequiredService<IReportStorageService>();
        var configService = scope.ServiceProvider.GetRequiredService<IConfigurationDataService>();

        var sw = Stopwatch.StartNew();
        var domainLabel = domain.ToString().ToLower();
        _logger.LogInformation("Starting {Domain} analysis pipeline...", domainLabel);

        // 1. Get domain-specific expert accounts
        var domainStr = domain == AnalysisDomain.Crypto ? "crypto" : "market";
        var experts = await configService.GetExpertsAsync(domainStr);

        // 2. Scrape tweets from experts
        _logger.LogInformation("Step 1: Fetching tweets from {Count} {Domain} experts...", experts.Count, domainLabel);
        var tweets = await tweetScraper.GetExpertTweetsAsync(experts);
        _logger.LogInformation("Collected {TweetCount} tweets from {ExpertCount} experts (source: {Source})",
            tweets.TotalTweetsCollected, tweets.ExpertsQueried.Count, tweets.DataSource);

        if (tweets.FailedExperts.Any())
            _logger.LogWarning("Failed to fetch tweets from: {FailedExperts}", string.Join(", ", tweets.FailedExperts));

        // 2b. Fetch real-time market data for mentioned tickers
        var tickers = tweets.Tweets.SelectMany(t => t.CashTags).Distinct().ToList();
        var marketData = await marketDataService.GetMarketDataAsync(tickers, domain);
        _logger.LogInformation("Fetched market data for {Count} tickers", marketData.Count);

        // 2c. Search for recent news about top mentioned tickers
        var topTickers = tickers.Take(5).ToList();
        var searchResults = new List<SearchResult>();
        if (topTickers.Any())
        {
            var searchQuery = domain == AnalysisDomain.Crypto
                ? $"crypto market news {string.Join(" ", topTickers)} today"
                : $"stock market news {string.Join(" ", topTickers)} today";
            _logger.LogInformation("Step 2b: Searching web for: {Query}", searchQuery);
            searchResults = await webSearchService.SearchAsync(searchQuery, 8);
            _logger.LogInformation("Found {Count} web search results", searchResults.Count);
        }

        // 3. AI analysis with domain-specific prompt
        _logger.LogInformation("Step 3: Running AI {Domain} analysis...", domainLabel);
        var analysis = await aiService.AnalyzeTweetsAsync(tweets, domain, marketData, searchResults);
        _logger.LogInformation("Analysis complete. Sentiment: {Sentiment} ({Score:+0.00;-0.00}), Signals: {SignalCount}",
            analysis.OverallSentiment, analysis.SentimentScore, analysis.TradingSignals.Count);

        // 4. Create report
        var model = await configService.GetDefaultAIModelAsync(domainStr);
        var modelName = model?.Name ?? model?.DeploymentName ?? "gpt-4o";

        var report = new MarketReport
        {
            Domain = domain,
            TweetData = tweets,
            Analysis = analysis,
            ModelUsed = modelName,
            MarketData = marketData.Select(m => new MarketDataSnapshot
            {
                Symbol = m.Symbol,
                Price = m.Price,
                Change24hPercent = m.Change24hPercent,
                Volume = m.Volume
            }).ToList(),
            WebSources = searchResults.Select(s => new WebSource
            {
                Title = s.Title,
                Url = s.Url,
                Snippet = s.Snippet
            }).ToList()
        };

        // 5. Send email to all recipients (email_recipients + subscribers tables, filtered by domain)
        var subscriberService = scope.ServiceProvider.GetRequiredService<ISubscriberService>();
        var allRecipients = new List<string>();

        try
        {
            var configRecipients = await configService.GetRecipientEmailsAsync(domainStr);
            _logger.LogInformation("Fetched {Count} email recipients from email_recipients table for domain '{Domain}'",
                configRecipients.Count, domainStr);
            allRecipients.AddRange(configRecipients);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch email_recipients: {Message}", ex.Message);
        }

        try
        {
            var subscriberEmails = await subscriberService.GetSubscriberEmailsForReportAsync(domainStr);
            _logger.LogInformation("Fetched {Count} subscriber emails for domain '{Domain}'",
                subscriberEmails.Count, domainStr);
            allRecipients.AddRange(subscriberEmails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch subscriber emails: {Message}", ex.Message);
        }

        // Deduplicate (same email could be in both tables)
        allRecipients = allRecipients.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        if (allRecipients.Any())
        {
            _logger.LogInformation("Step 4: Sending email to {RecipientCount} total recipients: {Recipients}",
                allRecipients.Count, string.Join(", ", allRecipients));
            var emailSent = await emailService.SendMarketReportAsync(report, allRecipients);
            report.EmailSent = emailSent;
            report.EmailRecipients = allRecipients;

            if (emailSent)
                _logger.LogInformation("Email sent successfully");
            else
                _logger.LogWarning("Email was not sent - check SMTP configuration");
        }
        else
        {
            _logger.LogWarning("No recipients found in either table for domain '{Domain}' - skipping email", domainStr);
        }

        // Increment trial usage for trial subscribers
        try
        {
            var trialIds = await subscriberService.GetTrialSubscriberIdsForReportAsync(domainStr);
            foreach (var id in trialIds)
            {
                await subscriberService.IncrementTrialUsageAsync(id);
            }
            if (trialIds.Any())
                _logger.LogInformation("Incremented trial usage for {Count} trial subscribers", trialIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to increment trial usage (non-fatal)");
        }

        // 6. Save report
        sw.Stop();
        report.DurationSeconds = Math.Round(sw.Elapsed.TotalSeconds, 1);

        _logger.LogInformation("Step 5: Saving report...");
        await storageService.SaveReportAsync(report);
        var htmlReport = emailService.BuildHtmlReport(report);
        await storageService.SaveReportHtmlAsync(report, htmlReport);
        _logger.LogInformation("Report saved with ID: {ReportId} (took {Duration}s)", report.Id, report.DurationSeconds);

        _logger.LogInformation("{Domain} analysis pipeline completed in {Duration}s", domainLabel, report.DurationSeconds);
        return report;
    }
}
