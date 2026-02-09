namespace ScraperAgent.Data.Entities;

public class SubscriberEntity
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string DomainPreference { get; set; } = "both"; // "market", "crypto", "both"
    public string Status { get; set; } = "trial"; // "trial", "active", "past_due", "cancelled", "expired"

    // Trial tracking
    public int TrialReportsUsed { get; set; }
    public DateTime TrialExpiresAt { get; set; }

    // Mollie payment
    public string? MollieCustomerId { get; set; }
    public string? MollieSubscriptionId { get; set; }
    public string? MollieMandateId { get; set; }
    public string? MollieFirstPaymentId { get; set; }

    // Token-based management (no auth)
    public string ManagementToken { get; set; } = string.Empty;

    // Email verification
    public bool EmailVerified { get; set; }
    public string? EmailVerificationToken { get; set; }

    // GDPR
    public DateTime ConsentGivenAt { get; set; }
    public string? ConsentIpAddress { get; set; }

    // Standard fields
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }
}
