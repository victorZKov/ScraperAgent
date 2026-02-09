using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IReportEmailService
{
    Task<bool> SendMarketReportAsync(MarketReport report, List<string> recipients);
    Task<bool> SendNotificationEmailAsync(string to, string subject, string htmlBody);
    string BuildHtmlReport(MarketReport report);
}
