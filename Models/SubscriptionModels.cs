namespace ScraperAgent.Models;

public record SubscribeRequest(
    string Email,
    string? Name,
    string DomainPreference // "market", "crypto", "both"
);

public record UpdateSubscriptionRequest(
    string? Name,
    string? DomainPreference
);

public record SubscriberResponse(
    int Id,
    string Email,
    string? Name,
    string DomainPreference,
    string Status,
    int TrialReportsUsed,
    int TrialReportsLimit,
    DateTime? TrialExpiresAt,
    bool EmailVerified,
    DateTime CreatedAt,
    string ManagementToken
);

public record AdminUpdateSubscriberRequest(
    string? Name,
    string? DomainPreference,
    string? Status
);

public record SubscriberStats(
    int TotalSubscribers,
    int TrialSubscribers,
    int ActiveSubscribers,
    int CancelledSubscribers,
    int ExpiredSubscribers,
    int MarketOnly,
    int CryptoOnly,
    int Both
);
