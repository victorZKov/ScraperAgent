using ScraperAgent.Models;
using ScraperAgent.Services;

namespace ScraperAgent.Endpoints;

public static class SubscriptionEndpoints
{
    private static ILogger Log(ILoggerFactory f) => f.CreateLogger("SubscriptionEndpoints");

    public static WebApplication MapSubscriptionEndpoints(this WebApplication app)
    {
        // Public subscriber endpoints
        var sub = app.MapGroup("/api/subscribe");
        sub.MapPost("/", CreateTrialSubscriber);
        sub.MapGet("/manage/{token}", GetSubscriber);
        sub.MapPut("/manage/{token}", UpdateSubscriber);
        sub.MapPost("/manage/{token}/upgrade", UpgradeSubscriber);
        sub.MapPost("/manage/{token}/cancel", CancelSubscription);
        sub.MapPost("/manage/{token}/check-payment", CheckPayment);
        sub.MapDelete("/manage/{token}", DeleteSubscriber);

        // Mollie webhook
        sub.MapPost("/webhooks/mollie", HandleMollieWebhook);

        // Admin endpoints
        var admin = app.MapGroup("/api/config").RequireAuthorization();
        admin.MapGet("/subscribers", ListSubscribers);
        admin.MapPut("/subscribers/{id:int}", AdminUpdateSubscriber);
        admin.MapGet("/subscribers/stats", GetSubscriberStats);
        admin.MapGet("/registration/status", GetRegistrationStatus);
        admin.MapPost("/registration/resume", ResumeRegistration);

        return app;
    }

    // ── Public endpoints ──────────────────────────────────────────────

    private static async Task<IResult> CreateTrialSubscriber(
        SubscribeRequest request,
        ISubscriberService subscriberService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return Results.BadRequest(new { success = false, error = "Email is required." });

            if (request.DomainPreference is not ("market" or "crypto" or "both"))
                return Results.BadRequest(new { success = false, error = "DomainPreference must be 'market', 'crypto', or 'both'." });

            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            var subscriber = await subscriberService.CreateTrialSubscriberAsync(
                request.Email, request.Name, request.DomainPreference, ipAddress);

            logger.LogInformation("Trial subscriber created: {Email}", request.Email);
            return Results.Json(new
            {
                success = true,
                subscriber = ToResponse(subscriber)
            }, statusCode: 201);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 409);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating trial subscriber");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> GetSubscriber(
        string token,
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var subscriber = await subscriberService.GetByManagementTokenAsync(token);
            if (subscriber == null)
                return Results.NotFound(new { success = false, error = "Subscriber not found." });

            return Results.Ok(new { success = true, subscriber = ToResponse(subscriber) });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error getting subscriber");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> UpdateSubscriber(
        string token,
        UpdateSubscriptionRequest request,
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (request.DomainPreference is not null and not ("market" or "crypto" or "both"))
                return Results.BadRequest(new { success = false, error = "DomainPreference must be 'market', 'crypto', or 'both'." });

            var subscriber = await subscriberService.UpdatePreferencesAsync(token, request.Name, request.DomainPreference);
            if (subscriber == null)
                return Results.NotFound(new { success = false, error = "Subscriber not found." });

            logger.LogInformation("Updated subscriber preferences: {Email}", subscriber.Email);
            return Results.Ok(new { success = true, subscriber = ToResponse(subscriber) });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating subscriber");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> UpgradeSubscriber(
        string token,
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var result = await subscriberService.StartPaidSubscriptionAsync(token);
            if (result == null)
                return Results.NotFound(new { success = false, error = "Subscriber not found." });

            logger.LogInformation("Started upgrade for token {Token}", token);
            return Results.Ok(new { success = true, checkoutUrl = result.Value.CheckoutUrl });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error upgrading subscriber");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> CancelSubscription(
        string token,
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var cancelled = await subscriberService.CancelSubscriptionAsync(token);
            if (!cancelled)
                return Results.NotFound(new { success = false, error = "Subscriber not found." });

            logger.LogInformation("Cancelled subscription for token {Token}", token);
            return Results.Ok(new { success = true, message = "Subscription cancelled." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error cancelling subscription");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> DeleteSubscriber(
        string token,
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var deleted = await subscriberService.DeleteSubscriberAsync(token);
            if (!deleted)
                return Results.NotFound(new { success = false, error = "Subscriber not found." });

            logger.LogInformation("GDPR delete for token {Token}", token);
            return Results.Ok(new { success = true, message = "All subscriber data has been permanently deleted." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting subscriber");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> CheckPayment(
        string token,
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var paymentStatus = await subscriberService.CheckAndActivatePaymentAsync(token);
            if (paymentStatus == null)
                return Results.NotFound(new { success = false, error = "No pending payment found." });

            logger.LogInformation("Payment check for token {Token}: {Status}", token, paymentStatus);

            var subscriber = await subscriberService.GetByManagementTokenAsync(token);
            return Results.Ok(new
            {
                success = true,
                paymentStatus,
                subscriber = subscriber != null ? ToResponse(subscriber) : null
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error checking payment");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    // ── Mollie webhook ────────────────────────────────────────────────

    private static async Task<IResult> HandleMollieWebhook(
        HttpContext context,
        ISubscriberService subscriberService,
        IMolliePaymentService mollieService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var form = await context.Request.ReadFormAsync();
            var paymentId = form["id"].FirstOrDefault();
            if (string.IsNullOrEmpty(paymentId))
                return Results.BadRequest(new { error = "Missing payment id" });

            logger.LogInformation("Mollie webhook received for payment {PaymentId}", paymentId);

            var status = await mollieService.GetPaymentStatusAsync(paymentId);
            if (status == "paid")
            {
                var customerId = await mollieService.GetPaymentCustomerIdAsync(paymentId);
                if (!string.IsNullOrEmpty(customerId))
                {
                    var mandateId = await mollieService.GetMandateIdAsync(customerId);
                    await subscriberService.ActivateAfterPaymentAsync(customerId, mandateId);
                    logger.LogInformation("Activated subscription for customer {CustomerId}", customerId);
                }
            }

            return Results.Ok();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error handling Mollie webhook");
            return Results.Ok(); // Always return 200 to Mollie
        }
    }

    // ── Admin endpoints ───────────────────────────────────────────────

    private static async Task<IResult> AdminUpdateSubscriber(
        int id,
        AdminUpdateSubscriberRequest request,
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (request.DomainPreference is not null and not ("market" or "crypto" or "both"))
                return Results.BadRequest(new { success = false, error = "DomainPreference must be 'market', 'crypto', or 'both'." });

            if (request.Status is not null and not ("trial" or "active" or "cancelled" or "expired"))
                return Results.BadRequest(new { success = false, error = "Status must be 'trial', 'active', 'cancelled', or 'expired'." });

            var subscriber = await subscriberService.AdminUpdateSubscriberAsync(id, request.Name, request.DomainPreference, request.Status);
            if (subscriber == null)
                return Results.NotFound(new { success = false, error = "Subscriber not found." });

            logger.LogInformation("Admin updated subscriber {Id}: domain={Domain}, status={Status}", id, request.DomainPreference, request.Status);
            return Results.Ok(new { success = true, subscriber = ToResponse(subscriber) });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating subscriber {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> ListSubscribers(
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var subscribers = await subscriberService.GetAllSubscribersAsync();
            return Results.Ok(new
            {
                subscribers = subscribers.Select(ToResponse),
                total = subscribers.Count
            });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error listing subscribers");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> GetSubscriberStats(
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var stats = await subscriberService.GetSubscriberStatsAsync();
            return Results.Ok(new { success = true, stats });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error getting subscriber stats");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> GetRegistrationStatus(
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var paused = await subscriberService.IsRegistrationPausedAsync();
            var stats = await subscriberService.GetSubscriberStatsAsync();
            return Results.Ok(new
            {
                success = true,
                registrationPaused = paused,
                totalSubscribers = stats.TotalSubscribers,
                nextPauseMilestone = ((stats.TotalSubscribers / 100) + 1) * 100
            });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error getting registration status");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> ResumeRegistration(
        ISubscriberService subscriberService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            await subscriberService.ResumeRegistrationAsync();
            logger.LogInformation("Registration resumed by admin");
            return Results.Ok(new { success = true, message = "Registration has been resumed." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error resuming registration");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private static SubscriberResponse ToResponse(Data.Entities.SubscriberEntity s) => new(
        Id: s.Id,
        Email: s.Email,
        Name: s.Name,
        DomainPreference: s.DomainPreference,
        Status: s.Status,
        TrialReportsUsed: s.TrialReportsUsed,
        TrialReportsLimit: 5,
        TrialExpiresAt: s.Status == "trial" ? s.TrialExpiresAt : null,
        EmailVerified: s.EmailVerified,
        CreatedAt: s.CreatedAt,
        ManagementToken: s.ManagementToken
    );
}
