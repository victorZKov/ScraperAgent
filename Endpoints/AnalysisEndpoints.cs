using System.Threading.Channels;
using ScraperAgent.Models;
using ScraperAgent.Services;

namespace ScraperAgent.Endpoints;

public static class AnalysisEndpoints
{
    public static WebApplication MapAnalysisEndpoints(this WebApplication app)
    {
        // Analysis trigger + job status (domain-parameterized)
        app.MapPost("/api/{domain}/analyze", TriggerAnalysis).RequireAuthorization();
        app.MapGet("/api/{domain}/jobs/{jobId}", GetJobStatus).RequireAuthorization();
        app.MapGet("/api/{domain}/reports/{reportId}", GetReport).RequireAuthorization();
        app.MapGet("/api/{domain}/reports", ListReports).RequireAuthorization();
        app.MapGet("/api/reports", ListAllReports).RequireAuthorization();
        app.MapPost("/api/{domain}/reports/{reportId}/resend-email", ResendEmail).RequireAuthorization();

        return app;
    }

    private static bool TryParseDomain(string domain, out AnalysisDomain result)
    {
        result = domain.ToLower() switch
        {
            "market" => AnalysisDomain.Market,
            "crypto" => AnalysisDomain.Crypto,
            _ => default
        };
        return domain.ToLower() is "market" or "crypto";
    }

    private static async Task<IResult> TriggerAnalysis(
        string domain,
        IJobTrackingService jobTracker,
        Channel<AnalysisJobMessage> channel,
        ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("AnalysisEndpoints");

        if (!TryParseDomain(domain, out var analysisDomain))
            return Results.BadRequest(new { error = $"Invalid domain: '{domain}'. Use 'market' or 'crypto'." });

        try
        {
            var job = jobTracker.CreateJob(analysisDomain);

            var message = new AnalysisJobMessage { JobId = job.Id, Domain = analysisDomain };
            await channel.Writer.WriteAsync(message);

            logger.LogInformation("{Domain} analysis job {JobId} enqueued", domain, job.Id);

            return Results.Accepted($"/api/{domain}/jobs/{job.Id}", new
            {
                success = true,
                jobId = job.Id,
                status = job.Status.ToString(),
                statusUrl = $"/api/{domain}/jobs/{job.Id}",
                message = "Analysis job queued. Check status at the statusUrl."
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error enqueuing {Domain} analysis job", domain);
            return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
        }
    }

    private static IResult GetJobStatus(
        string domain,
        string jobId,
        IJobTrackingService jobTracker)
    {
        if (!TryParseDomain(domain, out _))
            return Results.BadRequest(new { error = $"Invalid domain: '{domain}'." });

        var job = jobTracker.GetJob(jobId);
        if (job == null)
            return Results.NotFound(new { error = "Job not found", jobId });

        return Results.Ok(new
        {
            jobId = job.Id,
            status = job.Status.ToString(),
            domain = job.Domain.ToString(),
            createdAt = job.CreatedAt,
            completedAt = job.CompletedAt,
            reportId = job.ReportId,
            error = job.Error,
            reportUrl = job.ReportId != null ? $"/api/{domain}/reports/{job.ReportId}" : null
        });
    }

    private static async Task<IResult> GetReport(
        string domain,
        string reportId,
        IReportStorageService storageService)
    {
        if (!TryParseDomain(domain, out _))
            return Results.BadRequest(new { error = $"Invalid domain: '{domain}'." });

        var report = await storageService.GetReportAsync(reportId);
        if (report == null)
            return Results.NotFound(new { error = "Report not found", reportId });

        return Results.Ok(report);
    }

    private static async Task<IResult> ListReports(
        string domain,
        IReportStorageService storageService,
        HttpContext context)
    {
        if (!TryParseDomain(domain, out var analysisDomain))
            return Results.BadRequest(new { error = $"Invalid domain: '{domain}'." });

        var countStr = context.Request.Query["count"].FirstOrDefault();
        var count = int.TryParse(countStr, out var c) ? c : 10;

        var reports = await storageService.GetRecentReportsAsync(count, analysisDomain);
        return Results.Ok(new { reports, total = reports.Count });
    }

    private static async Task<IResult> ListAllReports(
        IReportStorageService storageService,
        HttpContext context)
    {
        var countStr = context.Request.Query["count"].FirstOrDefault();
        var count = int.TryParse(countStr, out var c) ? c : 20;

        var reports = await storageService.GetRecentReportsAsync(count);
        return Results.Ok(new { reports, total = reports.Count });
    }

    private static async Task<IResult> ResendEmail(
        string domain,
        string reportId,
        IReportStorageService storageService,
        IReportEmailService emailService,
        IConfigurationDataService configService,
        ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("AnalysisEndpoints");

        if (!TryParseDomain(domain, out _))
            return Results.BadRequest(new { error = $"Invalid domain: '{domain}'." });

        var report = await storageService.GetReportAsync(reportId);
        if (report == null)
            return Results.NotFound(new { error = "Report not found", reportId });

        var recipients = await configService.GetRecipientEmailsAsync();
        if (!recipients.Any())
            return Results.BadRequest(new { error = "No email recipients configured." });

        logger.LogInformation("Resending report {ReportId} to {Count} recipients", reportId, recipients.Count);
        var sent = await emailService.SendMarketReportAsync(report, recipients);

        if (sent)
        {
            report.EmailSent = true;
            report.EmailRecipients = recipients;
            await storageService.SaveReportAsync(report);
            return Results.Ok(new { success = true, recipients, message = $"Email sent to {recipients.Count} recipients." });
        }

        return Results.Json(new { success = false, error = "Failed to send email. Check SMTP configuration and logs." }, statusCode: 500);
    }
}
