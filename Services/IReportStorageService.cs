using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IReportStorageService
{
    Task SaveReportAsync(MarketReport report);
    Task SaveReportHtmlAsync(MarketReport report, string html);
    Task<MarketReport?> GetReportAsync(string reportId);
    Task<List<ReportMetadata>> GetRecentReportsAsync(int count = 10, AnalysisDomain? domain = null);
}
