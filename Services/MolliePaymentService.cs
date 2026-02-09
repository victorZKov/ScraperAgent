using Microsoft.Extensions.Options;
using Mollie.Api.Client;
using Mollie.Api.Models;
using Mollie.Api.Models.Customer.Request;
using Mollie.Api.Models.Payment;
using Mollie.Api.Models.Payment.Request;
using Mollie.Api.Models.Subscription.Request;
using ScraperAgent.Configuration;

namespace ScraperAgent.Services;

public class MolliePaymentService : IMolliePaymentService
{
    private readonly MollieOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MolliePaymentService> _logger;

    public MolliePaymentService(
        IOptions<MollieOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<MolliePaymentService> logger)
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    private HttpClient CreateHttpClient() => _httpClientFactory.CreateClient("Mollie");

    public async Task<string> CreateCustomerAsync(string email, string? name)
    {
        var customerClient = new CustomerClient(_options.ApiKey, CreateHttpClient());
        var request = new CustomerRequest
        {
            Email = email,
            Name = name ?? email
        };

        var response = await customerClient.CreateCustomerAsync(request);
        _logger.LogInformation("Created Mollie customer {CustomerId} for {Email}", response.Id, email);
        return response.Id;
    }

    public async Task<(string CheckoutUrl, string PaymentId)> CreateFirstPaymentAsync(string customerId, string email, string? managementToken = null)
    {
        var paymentClient = new PaymentClient(_options.ApiKey, CreateHttpClient());
        var redirectUrl = managementToken != null
            ? $"{_options.RedirectBaseUrl}/manage/{managementToken}?payment=pending"
            : $"{_options.RedirectBaseUrl}/subscribe?return=true";

        var request = new PaymentRequest
        {
            Amount = new Amount(_options.Currency, _options.MonthlyPrice),
            Description = "Market Intelligence Subscription Setup",
            RedirectUrl = redirectUrl,
            CustomerId = customerId,
            SequenceType = SequenceType.First
        };

        // Only set webhook URL if publicly reachable (skip for localhost dev)
        if (!_options.WebhookBaseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
            request.WebhookUrl = $"{_options.WebhookBaseUrl}/api/subscribe/webhooks/mollie";

        var response = await paymentClient.CreatePaymentAsync(request);
        _logger.LogInformation("Created first payment {PaymentId} for customer {CustomerId}", response.Id, customerId);
        return (response.Links.Checkout!.Href, response.Id);
    }

    public async Task<string> CreateSubscriptionAsync(string customerId)
    {
        var subscriptionClient = new SubscriptionClient(_options.ApiKey, CreateHttpClient());
        var request = new SubscriptionRequest
        {
            Amount = new Amount(_options.Currency, _options.MonthlyPrice),
            Interval = "1 month",
            Description = "Market Intelligence Monthly Subscription"
        };

        if (!_options.WebhookBaseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
            request.WebhookUrl = $"{_options.WebhookBaseUrl}/api/subscribe/webhooks/mollie";

        var response = await subscriptionClient.CreateSubscriptionAsync(customerId, request);
        _logger.LogInformation("Created subscription {SubscriptionId} for customer {CustomerId}", response.Id, customerId);
        return response.Id;
    }

    public async Task CancelSubscriptionAsync(string customerId, string subscriptionId)
    {
        var subscriptionClient = new SubscriptionClient(_options.ApiKey, CreateHttpClient());
        await subscriptionClient.CancelSubscriptionAsync(customerId, subscriptionId);
        _logger.LogInformation("Cancelled subscription {SubscriptionId} for customer {CustomerId}", subscriptionId, customerId);
    }

    public async Task<string> GetPaymentStatusAsync(string paymentId)
    {
        var paymentClient = new PaymentClient(_options.ApiKey, CreateHttpClient());
        var response = await paymentClient.GetPaymentAsync(paymentId);
        return response.Status;
    }

    public async Task<string?> GetPaymentCustomerIdAsync(string paymentId)
    {
        var paymentClient = new PaymentClient(_options.ApiKey, CreateHttpClient());
        var response = await paymentClient.GetPaymentAsync(paymentId);
        return response.CustomerId;
    }

    public async Task<string?> GetMandateIdAsync(string customerId)
    {
        var mandateClient = new MandateClient(_options.ApiKey, CreateHttpClient());
        var mandates = await mandateClient.GetMandateListAsync(customerId);
        var validMandate = mandates.Items?.FirstOrDefault(m => m.Status == "valid");
        return validMandate?.Id;
    }
}
