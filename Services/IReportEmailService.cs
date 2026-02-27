using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IReportEmailService
{
    Task<bool> SendMarketReportAsync(MarketReport report, List<string> recipients);
    Task<bool> SendNotificationEmailAsync(string to, string subject, string htmlBody);
    Task<bool> SendEmailVerificationAsync(string toEmail, string toName, string verifyUrl);
    Task<bool> SendCancellationConfirmationAsync(string toEmail, string toName);
    string BuildHtmlReport(MarketReport report);
}
