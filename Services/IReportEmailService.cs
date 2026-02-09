using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IReportEmailService
{
    Task<bool> SendMarketReportAsync(MarketReport report, List<string> recipients);
    string BuildHtmlReport(MarketReport report);
}
