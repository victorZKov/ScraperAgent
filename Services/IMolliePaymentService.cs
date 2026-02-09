namespace ScraperAgent.Services;

public interface IMolliePaymentService
{
    Task<string> CreateCustomerAsync(string email, string? name);
    Task<(string CheckoutUrl, string PaymentId)> CreateFirstPaymentAsync(string customerId, string email, string? managementToken = null);
    Task<string> CreateSubscriptionAsync(string customerId);
    Task CancelSubscriptionAsync(string customerId, string subscriptionId);
    Task<string> GetPaymentStatusAsync(string paymentId);
    Task<string?> GetPaymentCustomerIdAsync(string paymentId);
    Task<string?> GetMandateIdAsync(string customerId);
}
