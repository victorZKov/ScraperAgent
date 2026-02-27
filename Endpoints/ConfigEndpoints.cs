using Cronos;
using ScraperAgent.Data.Entities;
using ScraperAgent.Services;

namespace ScraperAgent.Endpoints;

public static class ConfigEndpoints
{
    private static ILogger Log(ILoggerFactory f) => f.CreateLogger("ConfigEndpoints");

    public static WebApplication MapConfigEndpoints(this WebApplication app)
    {
        var config = app.MapGroup("/api/config").RequireAuthorization();

        // Experts
        config.MapGet("/experts", ListExperts);
        config.MapPost("/experts", AddExpert);
        config.MapPut("/experts/{id:int}", UpdateExpert);
        config.MapDelete("/experts/{id:int}", DeleteExpert);

        // Email recipients
        config.MapGet("/recipients", ListRecipients);
        config.MapPost("/recipients", AddRecipient);
        config.MapPut("/recipients/{id:int}", UpdateRecipient);
        config.MapDelete("/recipients/{id:int}", DeleteRecipient);

        // AI Models
        config.MapGet("/ai-models", ListAIModels);
        config.MapPost("/ai-models", AddAIModel);
        config.MapPut("/ai-models/{id:int}", UpdateAIModel);
        config.MapDelete("/ai-models/{id:int}", DeleteAIModel);
        config.MapPost("/ai-models/{id:int}/set-default", SetDefaultAIModel);

        // Schedules
        config.MapGet("/schedules", ListSchedules);
        config.MapPost("/schedules", AddSchedule);
        config.MapPut("/schedules/{id:int}", UpdateSchedule);
        config.MapDelete("/schedules/{id:int}", DeleteSchedule);
        config.MapPost("/schedules/{id:int}/toggle", ToggleSchedule);

        return app;
    }

    // ── Experts ────────────────────────────────────────────────────────

    private static async Task<IResult> ListExperts(
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var domain = context.Request.Query["domain"].FirstOrDefault();
            var experts = await configService.GetExpertEntitiesAsync(domain);
            return Results.Ok(new { experts, total = experts.Count });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error listing experts");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> AddExpert(
        ExpertEntity expert,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (string.IsNullOrWhiteSpace(expert.Handle))
                return Results.BadRequest(new { success = false, error = "Invalid request body. 'handle' is required." });

            var created = await configService.AddExpertAsync(expert);
            logger.LogInformation("Added expert {Handle} via API", created.Handle);
            return Results.Json(new { success = true, expert = created }, statusCode: 201);
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error adding expert");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> UpdateExpert(
        int id,
        ExpertEntity updated,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var result = await configService.UpdateExpertAsync(id, updated);
            if (result == null)
                return Results.NotFound(new { success = false, error = "Expert not found", id });

            logger.LogInformation("Updated expert {Id} via API", id);
            return Results.Ok(new { success = true, expert = result });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating expert {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> DeleteExpert(
        int id,
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var permanent = string.Equals(context.Request.Query["permanent"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase);
            var deleted = await configService.DeleteExpertAsync(id, permanent);
            if (!deleted)
                return Results.NotFound(new { success = false, error = "Expert not found", id });

            var action = permanent ? "permanently deleted" : "deactivated";
            logger.LogInformation("{Action} expert {Id} via API", action, id);
            return Results.Ok(new { success = true, message = $"Expert {id} {action}" });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting expert {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    // ── Email Recipients ──────────────────────────────────────────────

    private static async Task<IResult> ListRecipients(
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var domain = context.Request.Query["domain"].FirstOrDefault();
            var recipients = await configService.GetRecipientsAsync(domain);
            return Results.Ok(new { recipients, total = recipients.Count });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error listing recipients");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> AddRecipient(
        EmailRecipientEntity recipient,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (string.IsNullOrWhiteSpace(recipient.Email))
                return Results.BadRequest(new { success = false, error = "Invalid request body. 'email' is required." });

            var created = await configService.AddRecipientAsync(recipient);
            logger.LogInformation("Added email recipient {Email} via API", created.Email);
            return Results.Json(new { success = true, recipient = created }, statusCode: 201);
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 409);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error adding recipient");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> UpdateRecipient(
        int id,
        EmailRecipientEntity updated,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var result = await configService.UpdateRecipientAsync(id, updated);
            if (result == null)
                return Results.NotFound(new { success = false, error = "Recipient not found", id });

            logger.LogInformation("Updated recipient {Id} via API", id);
            return Results.Ok(new { success = true, recipient = result });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating recipient {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> DeleteRecipient(
        int id,
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var permanent = string.Equals(context.Request.Query["permanent"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase);
            var deleted = await configService.DeleteRecipientAsync(id, permanent);
            if (!deleted)
                return Results.NotFound(new { success = false, error = "Recipient not found", id });

            var action = permanent ? "permanently deleted" : "deactivated";
            logger.LogInformation("{Action} recipient {Id} via API", action, id);
            return Results.Ok(new { success = true, message = $"Recipient {id} {action}" });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting recipient {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    // ── AI Models ─────────────────────────────────────────────────────

    private static string MaskApiKey(string apiKey)
    {
        if (string.IsNullOrEmpty(apiKey) || apiKey.Length <= 4)
            return "****";
        return new string('*', apiKey.Length - 4) + apiKey[^4..];
    }

    private static async Task<IResult> ListAIModels(
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var domain = context.Request.Query["domain"].FirstOrDefault();
            var models = await configService.GetAIModelsAsync(domain);

            var masked = models.Select(m => new
            {
                m.Id,
                m.Name,
                m.Provider,
                m.Endpoint,
                ApiKey = MaskApiKey(m.ApiKey),
                m.DeploymentName,
                m.IsDefault,
                m.Domain,
                m.IsActive,
                m.CreatedAt,
                m.UpdatedAt
            });

            return Results.Ok(new { models = masked, total = models.Count });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error listing AI models");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> AddAIModel(
        AIModelEntity model,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (string.IsNullOrWhiteSpace(model.Name) || string.IsNullOrWhiteSpace(model.Endpoint))
                return Results.BadRequest(new { success = false, error = "Invalid request body. 'name' and 'endpoint' are required." });

            var created = await configService.AddAIModelAsync(model);
            logger.LogInformation("Added AI model {Name} via API", created.Name);
            return Results.Json(new { success = true, model = created }, statusCode: 201);
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error adding AI model");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> UpdateAIModel(
        int id,
        AIModelEntity updated,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var result = await configService.UpdateAIModelAsync(id, updated);
            if (result == null)
                return Results.NotFound(new { success = false, error = "AI model not found", id });

            logger.LogInformation("Updated AI model {Id} via API", id);
            return Results.Ok(new { success = true, model = result });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating AI model {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> DeleteAIModel(
        int id,
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var permanent = string.Equals(context.Request.Query["permanent"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase);
            var deleted = await configService.DeleteAIModelAsync(id, permanent);
            if (!deleted)
                return Results.NotFound(new { success = false, error = "AI model not found", id });

            var action = permanent ? "permanently deleted" : "deactivated";
            logger.LogInformation("{Action} AI model {Id} via API", action, id);
            return Results.Ok(new { success = true, message = $"AI model {id} {action}" });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting AI model {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> SetDefaultAIModel(
        int id,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var result = await configService.SetDefaultAIModelAsync(id);
            if (!result)
                return Results.NotFound(new { success = false, error = "AI model not found or inactive", id });

            logger.LogInformation("Set AI model {Id} as default via API", id);
            return Results.Ok(new { success = true, message = $"AI model {id} set as default" });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error setting default AI model {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    // ── Schedules ────────────────────────────────────────────────────

    private static async Task<IResult> ListSchedules(
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        try
        {
            var schedules = await configService.GetSchedulesAsync();
            return Results.Ok(new { schedules, total = schedules.Count });
        }
        catch (Exception ex)
        {
            Log(loggerFactory).LogError(ex, "Error listing schedules");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> AddSchedule(
        ScheduleEntity schedule,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (string.IsNullOrWhiteSpace(schedule.Name) || string.IsNullOrWhiteSpace(schedule.CronExpression))
                return Results.BadRequest(new { success = false, error = "'name' and 'cronExpression' are required." });

            try { CronExpression.Parse(schedule.CronExpression); }
            catch { return Results.BadRequest(new { success = false, error = $"Invalid cron expression: '{schedule.CronExpression}'" }); }

            var created = await configService.AddScheduleAsync(schedule);
            logger.LogInformation("Added schedule '{Name}' via API", created.Name);
            return Results.Json(new { success = true, schedule = created }, statusCode: 201);
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error adding schedule");
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> UpdateSchedule(
        int id,
        ScheduleEntity updated,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            if (!string.IsNullOrWhiteSpace(updated.CronExpression))
            {
                try { CronExpression.Parse(updated.CronExpression); }
                catch { return Results.BadRequest(new { success = false, error = $"Invalid cron expression: '{updated.CronExpression}'" }); }
            }

            var result = await configService.UpdateScheduleAsync(id, updated);
            if (result == null)
                return Results.NotFound(new { success = false, error = "Schedule not found", id });

            logger.LogInformation("Updated schedule {Id} via API", id);
            return Results.Ok(new { success = true, schedule = result });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating schedule {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> DeleteSchedule(
        int id,
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var permanent = string.Equals(context.Request.Query["permanent"].FirstOrDefault(), "true", StringComparison.OrdinalIgnoreCase);
            var deleted = await configService.DeleteScheduleAsync(id, permanent);
            if (!deleted)
                return Results.NotFound(new { success = false, error = "Schedule not found", id });

            var action = permanent ? "permanently deleted" : "deactivated";
            logger.LogInformation("{Action} schedule {Id} via API", action, id);
            return Results.Ok(new { success = true, message = $"Schedule {id} {action}" });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting schedule {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static async Task<IResult> ToggleSchedule(
        int id,
        IConfigurationDataService configService,
        HttpContext context,
        ILoggerFactory loggerFactory)
    {
        var logger = Log(loggerFactory);
        try
        {
            var enableStr = context.Request.Query["enabled"].FirstOrDefault();
            if (!bool.TryParse(enableStr, out var enabled))
                return Results.BadRequest(new { success = false, error = "Query parameter 'enabled' (true/false) is required." });

            var result = await configService.ToggleScheduleAsync(id, enabled);
            if (!result)
                return Results.NotFound(new { success = false, error = "Schedule not found or inactive", id });

            logger.LogInformation("{Action} schedule {Id} via API", enabled ? "Enabled" : "Disabled", id);
            return Results.Ok(new { success = true, message = $"Schedule {id} {(enabled ? "enabled" : "disabled")}" });
        }
        catch (NotSupportedException ex)
        {
            return Results.BadRequest(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error toggling schedule {Id}", id);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }
}
