using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ScraperAgent.Data;
using ScraperAgent.Data.Entities;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

public class SubscriberService : ISubscriberService
{
    private readonly ScraperAgentDbContext _db;
    private readonly IMolliePaymentService _mollieService;
    private readonly ILogger<SubscriberService> _logger;
    private const int TrialReportLimit = 5;
    private static readonly TimeSpan TrialDuration = TimeSpan.FromDays(7);

    public SubscriberService(
        ScraperAgentDbContext db,
        IMolliePaymentService mollieService,
        ILogger<SubscriberService> logger)
    {
        _db = db;
        _mollieService = mollieService;
        _logger = logger;
    }

    public async Task<SubscriberEntity> CreateTrialSubscriberAsync(string email, string? name, string domainPreference, string? ipAddress)
    {
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

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}
