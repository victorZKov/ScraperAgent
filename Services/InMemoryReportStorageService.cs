using System.Collections.Concurrent;
using ScraperAgent.Models;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace ScraperAgent.Services;

public class InMemoryReportStorageService : IReportStorageService
{
    private readonly ConcurrentDictionary<string, MarketReport> _reports = new();
    private readonly ILogger<InMemoryReportStorageService> _logger;
    private const int MaxReports = 100;
    private static readonly string ReportsDir = Path.Combine(Directory.GetCurrentDirectory(), "reports");

    public InMemoryReportStorageService(ILogger<InMemoryReportStorageService> logger)
    {
        _logger = logger;
        Directory.CreateDirectory(ReportsDir);
    }

    public Task SaveReportAsync(MarketReport report)
    {
        _reports[report.Id] = report;

        // Evict oldest if over limit
        if (_reports.Count > MaxReports)
        {
            var oldest = _reports.OrderBy(r => r.Value.GeneratedAt).First();
            _reports.TryRemove(oldest.Key, out _);
            _logger.LogInformation("Evicted oldest report {ReportId} to stay under {MaxReports} limit", oldest.Key, MaxReports);
        }

        // Save JSON to disk
        try
        {
            var timestamp = report.GeneratedAt.ToString("yyyy-MM-dd_HH-mm-ss");
            var domainPrefix = report.Domain == AnalysisDomain.Crypto ? "crypto" : "market";
            var jsonPath = Path.Combine(ReportsDir, $"{domainPrefix}_report_{timestamp}_{report.Id[..8]}.json");
            var json = JsonConvert.SerializeObject(report, Formatting.Indented);
            File.WriteAllText(jsonPath, json);
            _logger.LogInformation("Report saved to disk: {Path}", jsonPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save report JSON to disk");
        }

        _logger.LogInformation("Report {ReportId} saved. Total reports: {Count}", report.Id, _reports.Count);
        return Task.CompletedTask;
    }

    public Task SaveReportHtmlAsync(MarketReport report, string html)
    {
        try
        {
            var timestamp = report.GeneratedAt.ToString("yyyy-MM-dd_HH-mm-ss");
            var domainPrefix = report.Domain == AnalysisDomain.Crypto ? "crypto" : "market";
            var htmlPath = Path.Combine(ReportsDir, $"{domainPrefix}_report_{timestamp}_{report.Id[..8]}.html");
            File.WriteAllText(htmlPath, html);
            _logger.LogInformation("Report HTML saved to disk: {Path}", htmlPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save report HTML to disk");
        }

        return Task.CompletedTask;
    }

    public Task<MarketReport?> GetReportAsync(string reportId)
    {
        _reports.TryGetValue(reportId, out var report);
        return Task.FromResult(report);
    }

    public Task<List<ReportMetadata>> GetRecentReportsAsync(int count = 10, AnalysisDomain? domain = null)
    {
        var query = _reports.Values.AsEnumerable();

        if (domain.HasValue)
            query = query.Where(r => r.Domain == domain.Value);

        var metadata = query
            .OrderByDescending(r => r.GeneratedAt)
            .Take(count)
            .Select(r => new ReportMetadata
            {
                Id = r.Id,
                GeneratedAt = r.GeneratedAt,
                Domain = r.Domain,
                TweetsAnalyzed = r.TweetData.TotalTweetsCollected,
                ExpertsIncluded = r.TweetData.ExpertsQueried.Count,
                OverallSentiment = r.Analysis.OverallSentiment.ToString(),
                SentimentScore = r.Analysis.SentimentScore
            })
            .ToList();

        return Task.FromResult(metadata);
    }
}
