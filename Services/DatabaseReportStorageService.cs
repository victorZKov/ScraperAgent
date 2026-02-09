using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using ScraperAgent.Data;
using ScraperAgent.Data.Entities;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

public class DatabaseReportStorageService : IReportStorageService
{
    private readonly ScraperAgentDbContext _db;
    private readonly ILogger<DatabaseReportStorageService> _logger;

    public DatabaseReportStorageService(
        ScraperAgentDbContext db,
        ILogger<DatabaseReportStorageService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SaveReportAsync(MarketReport report)
    {
        var entity = new ReportEntity
        {
            Id = report.Id,
            Domain = report.Domain == AnalysisDomain.Crypto ? "crypto" : "market",
            GeneratedAt = report.GeneratedAt,
            TweetsAnalyzed = report.TweetData.TotalTweetsCollected,
            ExpertsIncluded = report.TweetData.ExpertsQueried.Count,
            OverallSentiment = report.Analysis.OverallSentiment.ToString(),
            SentimentScore = report.Analysis.SentimentScore,
            ModelUsed = report.ModelUsed,
            DurationSeconds = report.DurationSeconds,
            ReportJson = JsonConvert.SerializeObject(report)
        };

        var existing = await _db.Reports.FindAsync(report.Id);
        if (existing != null)
        {
            existing.ReportJson = entity.ReportJson;
            existing.OverallSentiment = entity.OverallSentiment;
            existing.SentimentScore = entity.SentimentScore;
        }
        else
        {
            _db.Reports.Add(entity);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Report {ReportId} saved to database", report.Id);
    }

    public Task SaveReportHtmlAsync(MarketReport report, string html)
    {
        // HTML is not persisted to DB — the UI renders from JSON data
        return Task.CompletedTask;
    }

    public async Task<MarketReport?> GetReportAsync(string reportId)
    {
        var entity = await _db.Reports.FindAsync(reportId);
        if (entity == null) return null;

        try
        {
            return JsonConvert.DeserializeObject<MarketReport>(entity.ReportJson);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize report {ReportId}", reportId);
            return null;
        }
    }

    public async Task<List<ReportMetadata>> GetRecentReportsAsync(int count = 10, AnalysisDomain? domain = null)
    {
        var query = _db.Reports.AsQueryable();

        if (domain.HasValue)
        {
            var domainStr = domain.Value == AnalysisDomain.Crypto ? "crypto" : "market";
            query = query.Where(r => r.Domain == domainStr);
        }

        return await query
            .OrderByDescending(r => r.GeneratedAt)
            .Take(count)
            .Select(r => new ReportMetadata
            {
                Id = r.Id,
                GeneratedAt = r.GeneratedAt,
                Domain = r.Domain == "crypto" ? AnalysisDomain.Crypto : AnalysisDomain.Market,
                TweetsAnalyzed = r.TweetsAnalyzed,
                ExpertsIncluded = r.ExpertsIncluded,
                OverallSentiment = r.OverallSentiment,
                SentimentScore = r.SentimentScore,
                ModelUsed = r.ModelUsed,
                DurationSeconds = r.DurationSeconds
            })
            .ToListAsync();
    }
}
