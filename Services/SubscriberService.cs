using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ScraperAgent.Configuration;
using ScraperAgent.Data;
using ScraperAgent.Data.Entities;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

public class SubscriberService : ISubscriberService
{
    private readonly ScraperAgentDbContext _db;
    private readonly IMolliePaymentService _mollieService;
    private readonly IReportEmailService _emailService;
    private readonly IReportStorageService _reportStorage;
    private readonly MollieOptions _mollieOptions;
    private readonly ILogger<SubscriberService> _logger;
    private const int TrialReportLimit = 5;
    private const int RegistrationPauseMilestone = 100;
    private const string AdminEmail = "it@kovimatic.ie";
    private const string RegistrationPausedKey = "registration_paused";
    private static readonly TimeSpan TrialDuration = TimeSpan.FromDays(7);

    public SubscriberService(
        ScraperAgentDbContext db,
        IMolliePaymentService mollieService,
        IReportEmailService emailService,
        IReportStorageService reportStorage,
        IOptions<MollieOptions> mollieOptions,
        ILogger<SubscriberService> logger)
    {
        _db = db;
        _mollieService = mollieService;
        _emailService = emailService;
        _reportStorage = reportStorage;
        _mollieOptions = mollieOptions.Value;
        _logger = logger;
    }

    public async Task<SubscriberEntity> CreateTrialSubscriberAsync(string email, string? name, string domainPreference, string? ipAddress)
    {
        // Check if registration is paused
        if (await IsRegistrationPausedAsync())
            throw new InvalidOperationException("Registration is temporarily paused. Please try again later.");

        var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Email == email);
        if (existing != null)
        {
            if (existing.Status == "cancelled" || existing.Status == "expired")
            {
                // Reactivate as trial
                existing.Status = "trial";
                existing.TrialReportsUsed = 0;
                existing.TrialExpiresAt = DateTime.UtcNow.Add(TrialDuration);
                existing.ManagementToken = GenerateToken();
                existing.Name = name ?? existing.Name;
                existing.DomainPreference = domainPreference;
                existing.IsActive = true;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.CancelledAt = null;
                await _db.SaveChangesAsync();
                // Fire-and-forget: don't block the HTTP response on email delivery
                _ = Task.Run(async () =>
                {
                    await SendRegistrationNotificationAsync(existing, isReactivation: true);
                    await SendWelcomeWithLatestReportAsync(existing);
                });
                return existing;
            }
            throw new InvalidOperationException("A subscriber with this email already exists.");
        }

        var subscriber = new SubscriberEntity
        {
            Email = email,
            Name = name,
            DomainPreference = domainPreference,
            Status = "trial",
            TrialReportsUsed = 0,
            TrialExpiresAt = DateTime.UtcNow.Add(TrialDuration),
            ManagementToken = GenerateToken(),
            ConsentGivenAt = DateTime.UtcNow,
            ConsentIpAddress = ipAddress,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Subscribers.Add(subscriber);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Created trial subscriber {Email} with token {Token}", email, subscriber.ManagementToken);

        // Fire-and-forget: don't block the HTTP response on email delivery
        _ = Task.Run(async () =>
        {
            await SendRegistrationNotificationAsync(subscriber, isReactivation: false);
            await SendWelcomeWithLatestReportAsync(subscriber);
        });

        // Auto-pause registration at every milestone (100, 200, 300...)
        var totalCount = await _db.Subscribers.CountAsync();
        if (totalCount > 0 && totalCount % RegistrationPauseMilestone == 0)
        {
            await PauseRegistrationAsync($"Auto-paused at {totalCount} subscribers");
            _logger.LogWarning("Registration auto-paused at {Count} subscribers", totalCount);
        }

        return subscriber;
    }

    public async Task<SubscriberEntity?> GetByManagementTokenAsync(string token)
    {
        return await _db.Subscribers.FirstOrDefaultAsync(s => s.ManagementToken == token && s.IsActive);
    }

    public async Task<SubscriberEntity?> UpdatePreferencesAsync(string token, string? name, string? domainPreference)
    {
        var subscriber = await GetByManagementTokenAsync(token);
        if (subscriber == null) return null;

        if (name != null) subscriber.Name = name;
        if (domainPreference != null) subscriber.DomainPreference = domainPreference;
        subscriber.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return subscriber;
    }

    public async Task<bool> CancelSubscriptionAsync(string token)
    {
        var subscriber = await GetByManagementTokenAsync(token);
        if (subscriber == null) return false;

        if (!string.IsNullOrEmpty(subscriber.MollieCustomerId) && !string.IsNullOrEmpty(subscriber.MollieSubscriptionId))
        {
            try
            {
                await _mollieService.CancelSubscriptionAsync(subscriber.MollieCustomerId, subscriber.MollieSubscriptionId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cancel Mollie subscription for {Email}", subscriber.Email);
            }
        }

        subscriber.Status = "cancelled";
        subscriber.CancelledAt = DateTime.UtcNow;
        subscriber.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteSubscriberAsync(string token)
    {
        var subscriber = await _db.Subscribers.FirstOrDefaultAsync(s => s.ManagementToken == token);
        if (subscriber == null) return false;

        // Cancel Mollie subscription if exists
        if (!string.IsNullOrEmpty(subscriber.MollieCustomerId) && !string.IsNullOrEmpty(subscriber.MollieSubscriptionId))
        {
            try
            {
                await _mollieService.CancelSubscriptionAsync(subscriber.MollieCustomerId, subscriber.MollieSubscriptionId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cancel Mollie subscription during GDPR delete for {Email}", subscriber.Email);
            }
        }

        // GDPR: hard delete
        _db.Subscribers.Remove(subscriber);
        await _db.SaveChangesAsync();
        _logger.LogInformation("GDPR: Permanently deleted subscriber data for token {Token}", token);
        return true;
    }

    public async Task<(string CheckoutUrl, string PaymentId)?> StartPaidSubscriptionAsync(string token)
    {
        var subscriber = await GetByManagementTokenAsync(token);
        if (subscriber == null) return null;

        // Create Mollie customer if needed
        if (string.IsNullOrEmpty(subscriber.MollieCustomerId))
        {
            subscriber.MollieCustomerId = await _mollieService.CreateCustomerAsync(subscriber.Email, subscriber.Name);
        }

        // Create first payment to establish mandate
        var (checkoutUrl, paymentId) = await _mollieService.CreateFirstPaymentAsync(subscriber.MollieCustomerId, subscriber.Email, subscriber.ManagementToken);
        subscriber.MollieFirstPaymentId = paymentId;
        subscriber.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return (checkoutUrl, paymentId);
    }

    public async Task<string?> CheckAndActivatePaymentAsync(string token)
    {
        var subscriber = await GetByManagementTokenAsync(token);
        if (subscriber == null || string.IsNullOrEmpty(subscriber.MollieFirstPaymentId))
            return null;

        var status = await _mollieService.GetPaymentStatusAsync(subscriber.MollieFirstPaymentId);

        if (status == "paid" && subscriber.Status != "active")
        {
            var mandateId = await _mollieService.GetMandateIdAsync(subscriber.MollieCustomerId!);
            await ActivateAfterPaymentAsync(subscriber.MollieCustomerId!, mandateId);
        }

        return status;
    }

    public async Task ActivateAfterPaymentAsync(string mollieCustomerId, string? mandateId)
    {
        var subscriber = await _db.Subscribers.FirstOrDefaultAsync(s => s.MollieCustomerId == mollieCustomerId);
        if (subscriber == null)
        {
            _logger.LogWarning("No subscriber found for Mollie customer {CustomerId}", mollieCustomerId);
            return;
        }

        subscriber.MollieMandateId = mandateId;

        // Create recurring subscription
        var subscriptionId = await _mollieService.CreateSubscriptionAsync(mollieCustomerId);
        subscriber.MollieSubscriptionId = subscriptionId;
        subscriber.Status = "active";
        subscriber.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Activated paid subscription for {Email}", subscriber.Email);
    }

    public async Task<int> IncrementTrialUsageAsync(int subscriberId)
    {
        var subscriber = await _db.Subscribers.FindAsync(subscriberId);
        if (subscriber == null) return 0;

        subscriber.TrialReportsUsed++;
        subscriber.UpdatedAt = DateTime.UtcNow;

        if (subscriber.TrialReportsUsed >= TrialReportLimit)
        {
            subscriber.Status = "expired";
            _logger.LogInformation("Trial expired for {Email} (used {Count} reports)", subscriber.Email, subscriber.TrialReportsUsed);
            await SendTrialExpiredEmailAsync(subscriber);
        }

        await _db.SaveChangesAsync();
        return subscriber.TrialReportsUsed;
    }

    public async Task<List<string>> GetSubscriberEmailsForReportAsync(string domain)
    {
        var now = DateTime.UtcNow;
        return await _db.Subscribers
            .Where(s => s.IsActive &&
                (s.DomainPreference == domain || s.DomainPreference == "both") &&
                (s.Status == "active" ||
                 (s.Status == "trial" && s.TrialReportsUsed < TrialReportLimit && s.TrialExpiresAt > now)))
            .Select(s => s.Email)
            .ToListAsync();
    }

    public async Task<List<int>> GetTrialSubscriberIdsForReportAsync(string domain)
    {
        var now = DateTime.UtcNow;
        return await _db.Subscribers
            .Where(s => s.IsActive &&
                s.Status == "trial" &&
                (s.DomainPreference == domain || s.DomainPreference == "both") &&
                s.TrialReportsUsed < TrialReportLimit &&
                s.TrialExpiresAt > now)
            .Select(s => s.Id)
            .ToListAsync();
    }

    public async Task<List<SubscriberEntity>> GetAllSubscribersAsync()
    {
        return await _db.Subscribers.OrderByDescending(s => s.CreatedAt).ToListAsync();
    }

    public async Task<SubscriberStats> GetSubscriberStatsAsync()
    {
        var subscribers = await _db.Subscribers.Where(s => s.IsActive).ToListAsync();
        return new SubscriberStats(
            TotalSubscribers: subscribers.Count,
            TrialSubscribers: subscribers.Count(s => s.Status == "trial"),
            ActiveSubscribers: subscribers.Count(s => s.Status == "active"),
            CancelledSubscribers: subscribers.Count(s => s.Status == "cancelled"),
            ExpiredSubscribers: subscribers.Count(s => s.Status == "expired"),
            MarketOnly: subscribers.Count(s => s.DomainPreference == "market"),
            CryptoOnly: subscribers.Count(s => s.DomainPreference == "crypto"),
            Both: subscribers.Count(s => s.DomainPreference == "both")
        );
    }

    public async Task<bool> IsRegistrationPausedAsync()
    {
        var setting = await _db.AppSettings.FindAsync(RegistrationPausedKey);
        return setting?.Value == "true";
    }

    public async Task ResumeRegistrationAsync()
    {
        var setting = await _db.AppSettings.FindAsync(RegistrationPausedKey);
        if (setting != null)
        {
            setting.Value = "false";
            setting.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        _logger.LogInformation("Registration resumed by admin");
    }

    private async Task PauseRegistrationAsync(string reason)
    {
        var setting = await _db.AppSettings.FindAsync(RegistrationPausedKey);
        if (setting != null)
        {
            setting.Value = "true";
            setting.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.AppSettings.Add(new AppSettingEntity
            {
                Key = RegistrationPausedKey,
                Value = "true",
                UpdatedAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();

        // Notify admin about the pause
        var totalCount = await _db.Subscribers.CountAsync();
        var html = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <div style='background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 20px; border-radius: 8px 8px 0 0;'>
        <h2 style='margin: 0;'>Registration Paused</h2>
    </div>
    <div style='background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 0 0 8px 8px;'>
        <p><strong>Reason:</strong> {reason}</p>
        <p><strong>Total subscribers:</strong> {totalCount}</p>
        <p>Registration has been automatically paused. Review your infrastructure and resume registration from the admin panel when ready.</p>
    </div>
</div>";

        await _emailService.SendNotificationEmailAsync(
            AdminEmail,
            $"[ScraperAgent] Registration paused at {totalCount} subscribers",
            html);
    }

    private async Task SendRegistrationNotificationAsync(SubscriberEntity subscriber, bool isReactivation)
    {
        try
        {
            var totalCount = await _db.Subscribers.CountAsync();
            var action = isReactivation ? "reactivated" : "registered";
            var html = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <div style='background: linear-gradient(135deg, #1a237e, #283593); color: white; padding: 20px; border-radius: 8px 8px 0 0;'>
        <h2 style='margin: 0;'>New Subscriber {(isReactivation ? "Reactivated" : "Registered")}</h2>
    </div>
    <div style='background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 0 0 8px 8px;'>
        <table style='width: 100%; border-collapse: collapse;'>
            <tr><td style='padding: 8px; color: #666;'>Email</td><td style='padding: 8px; font-weight: bold;'>{subscriber.Email}</td></tr>
            <tr><td style='padding: 8px; color: #666;'>Name</td><td style='padding: 8px;'>{subscriber.Name ?? "—"}</td></tr>
            <tr><td style='padding: 8px; color: #666;'>Preference</td><td style='padding: 8px;'>{subscriber.DomainPreference}</td></tr>
            <tr><td style='padding: 8px; color: #666;'>Status</td><td style='padding: 8px;'>{subscriber.Status}</td></tr>
            <tr><td style='padding: 8px; color: #666;'>Total subscribers</td><td style='padding: 8px; font-weight: bold;'>{totalCount}</td></tr>
        </table>
        <p style='color: #888; font-size: 12px; margin-top: 15px;'>
            Next pause milestone: {((totalCount / RegistrationPauseMilestone) + 1) * RegistrationPauseMilestone} subscribers
        </p>
    </div>
</div>";

            await _emailService.SendNotificationEmailAsync(
                AdminEmail,
                $"[ScraperAgent] Subscriber #{totalCount} {action}: {subscriber.Email}",
                html);
        }
        catch (Exception ex)
        {
            // Don't fail registration if notification email fails
            _logger.LogWarning(ex, "Failed to send registration notification for {Email}", subscriber.Email);
        }
    }

    private async Task SendTrialExpiredEmailAsync(SubscriberEntity subscriber)
    {
        try
        {
            var manageUrl = $"{_mollieOptions.RedirectBaseUrl}/manage/{subscriber.ManagementToken}";
            var price = _mollieOptions.MonthlyPrice;
            var currencySymbol = _mollieOptions.Currency.ToUpperInvariant() switch
            {
                "EUR" => "\u20ac",
                "GBP" => "\u00a3",
                _ => "$"
            };

            var html = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <div style='background: linear-gradient(135deg, #1a237e, #283593); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;'>
        <h1 style='margin: 0 0 8px 0; font-size: 24px;'>Your Trial Has Ended</h1>
        <p style='margin: 0; opacity: 0.9;'>You've used all {TrialReportLimit} free reports</p>
    </div>
    <div style='background: #fff; border: 1px solid #e0e0e0; padding: 30px; border-radius: 0 0 8px 8px;'>
        <p>Hi{(subscriber.Name != null ? $" {subscriber.Name}" : "")},</p>
        <p>Thank you for trying ScraperAgent! Your free trial of {TrialReportLimit} reports has ended. We hope you found our AI-powered market intelligence valuable.</p>

        <div style='background: #f8f9fa; border: 2px solid #1a237e; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;'>
            <h2 style='margin: 0 0 8px 0; color: #1a237e;'>Upgrade to Full Access</h2>
            <p style='margin: 0 0 15px 0; color: #666;'>Unlimited reports for just <strong>{currencySymbol}{price}/month</strong></p>
            <a href='{manageUrl}' style='display: inline-block; background: linear-gradient(135deg, #1a237e, #283593); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;'>
                Upgrade Now
            </a>
        </div>

        <p style='color: #666; font-size: 14px;'>What you get with a paid subscription:</p>
        <ul style='color: #666; font-size: 14px;'>
            <li>Unlimited daily market & crypto intelligence reports</li>
            <li>Expert sentiment analysis from top analysts</li>
            <li>AI-powered trading signals and recommendations</li>
            <li>Sector breakdowns and risk assessments</li>
        </ul>

        <p style='color: #888; font-size: 13px; margin-top: 20px;'>
            You can manage your subscription anytime at <a href='{manageUrl}' style='color: #1a237e;'>your account page</a>.
        </p>
    </div>
    <div style='text-align: center; padding: 15px; color: #999; font-size: 11px;'>
        <p>ScraperAgent by <a href='https://kovimatic.ie' style='color: #999;'>Kovimatic</a></p>
    </div>
</div>";

            await _emailService.SendNotificationEmailAsync(
                subscriber.Email,
                "Your ScraperAgent trial has ended — Upgrade for unlimited access",
                html);

            _logger.LogInformation("Trial expired email sent to {Email}", subscriber.Email);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send trial expired email to {Email}", subscriber.Email);
        }
    }

    private async Task SendWelcomeWithLatestReportAsync(SubscriberEntity subscriber)
    {
        try
        {
            // Determine which domain to fetch the latest report for
            AnalysisDomain? domain = subscriber.DomainPreference switch
            {
                "market" => AnalysisDomain.Market,
                "crypto" => AnalysisDomain.Crypto,
                _ => null // "both" — get the most recent regardless
            };

            var recentReports = await _reportStorage.GetRecentReportsAsync(1, domain);
            if (recentReports.Count == 0)
            {
                _logger.LogInformation("No reports available to send as welcome email to {Email}", subscriber.Email);
                return;
            }

            var report = await _reportStorage.GetReportAsync(recentReports[0].Id);
            if (report == null) return;

            var reportHtml = _emailService.BuildHtmlReport(report);

            var isCrypto = report.Domain == AnalysisDomain.Crypto;
            var reportLabel = isCrypto ? "Crypto Intelligence Report" : "Market Intelligence Report";

            var welcomeHeader = $@"
<div style='font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;'>
    <div style='background: linear-gradient(135deg, #2e7d32, #43a047); color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; text-align: center;'>
        <h1 style='margin: 0 0 10px 0; font-size: 24px;'>Welcome to ScraperAgent!</h1>
        <p style='margin: 0; opacity: 0.9;'>Hi{(subscriber.Name != null ? $" {subscriber.Name}" : "")}, thanks for subscribing. Here's your first report to get you started.</p>
        <p style='margin: 8px 0 0 0; font-size: 13px; opacity: 0.8;'>Your 7-day free trial includes {TrialReportLimit} reports.</p>
    </div>
</div>";

            var fullHtml = welcomeHeader + reportHtml;

            await _emailService.SendNotificationEmailAsync(
                subscriber.Email,
                $"Welcome to ScraperAgent — Your latest {reportLabel}",
                fullHtml);

            _logger.LogInformation("Welcome email with latest report sent to {Email}", subscriber.Email);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send welcome email with report to {Email}", subscriber.Email);
        }
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}
