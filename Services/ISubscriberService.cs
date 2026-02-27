using ScraperAgent.Data.Entities;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface ISubscriberService
{
    Task<SubscriberEntity> CreateTrialSubscriberAsync(string email, string? name, string domainPreference, string? ipAddress);
    Task<SubscriberEntity?> GetByManagementTokenAsync(string token);
    Task<SubscriberEntity?> UpdatePreferencesAsync(string token, string? name, string? domainPreference);
    Task<SubscriberEntity?> VerifyEmailAsync(string verificationToken);
    Task<bool> CancelSubscriptionAsync(string token);
    Task<bool> DeleteSubscriberAsync(string token);
    Task<(string CheckoutUrl, string PaymentId)?> StartPaidSubscriptionAsync(string token);
    Task ActivateAfterPaymentAsync(string mollieCustomerId, string? mandateId);
    Task<string?> CheckAndActivatePaymentAsync(string token);
    Task<int> IncrementTrialUsageAsync(int subscriberId);
    Task<List<string>> GetSubscriberEmailsForReportAsync(string domain);
    Task<List<int>> GetTrialSubscriberIdsForReportAsync(string domain);
    Task<SubscriberEntity?> AdminUpdateSubscriberAsync(int id, string? name, string? domainPreference, string? status);
    Task<List<SubscriberEntity>> GetAllSubscribersAsync();
    Task<SubscriberStats> GetSubscriberStatsAsync();
    Task<bool> IsRegistrationPausedAsync();
    Task ResumeRegistrationAsync();
}
