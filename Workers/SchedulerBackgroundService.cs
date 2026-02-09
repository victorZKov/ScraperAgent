using System.Threading.Channels;
using Cronos;
using ScraperAgent.Data.Entities;
using ScraperAgent.Models;
using ScraperAgent.Services;

namespace ScraperAgent.Workers;

public class SchedulerBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly Channel<AnalysisJobMessage> _channel;
    private readonly IJobTrackingService _jobTracker;
    private readonly ILogger<SchedulerBackgroundService> _logger;

    private static readonly TimeSpan TickInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan MissedRunGracePeriod = TimeSpan.FromMinutes(10);

    public SchedulerBackgroundService(
        IServiceScopeFactory scopeFactory,
        Channel<AnalysisJobMessage> channel,
        IJobTrackingService jobTracker,
        ILogger<SchedulerBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _channel = channel;
        _jobTracker = jobTracker;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Scheduler background service started (tick interval: {Interval}s)",
            TickInterval.TotalSeconds);

        // Let the app finish starting up and DB seeding
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndFireSchedulesAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error in scheduler tick");
            }

            await Task.Delay(TickInterval, stoppingToken);
        }

        _logger.LogInformation("Scheduler background service stopped");
    }

    private async Task CheckAndFireSchedulesAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var configService = scope.ServiceProvider.GetRequiredService<IConfigurationDataService>();

        var now = DateTime.UtcNow;
        var dueSchedules = await configService.GetDueSchedulesAsync(now);

        foreach (var schedule in dueSchedules)
        {
            try
            {
                // Skip if missed by more than the grace period
                if (schedule.NextRunAt.HasValue &&
                    (now - schedule.NextRunAt.Value) > MissedRunGracePeriod)
                {
                    _logger.LogWarning(
                        "Schedule '{Name}' (id:{Id}) missed run at {MissedTime:u} (>{Grace}min ago). Advancing to next occurrence.",
                        schedule.Name, schedule.Id, schedule.NextRunAt, MissedRunGracePeriod.TotalMinutes);

                    var nextRun = ComputeNextRun(schedule.CronExpression, schedule.Timezone);
                    await configService.UpdateScheduleAfterRunAsync(schedule.Id, "SKIPPED", nextRun);
                    continue;
                }

                // Skip if previous job is still running
                if (!string.IsNullOrEmpty(schedule.LastRunJobId) &&
                    schedule.LastRunJobId != "SKIPPED")
                {
                    var lastJob = _jobTracker.GetJob(schedule.LastRunJobId);
                    if (lastJob != null &&
                        lastJob.Status is JobStatus.Queued or JobStatus.Running)
                    {
                        _logger.LogWarning(
                            "Schedule '{Name}' (id:{Id}) skipping - previous job {JobId} is still {Status}",
                            schedule.Name, schedule.Id, schedule.LastRunJobId, lastJob.Status);

                        var nextRun = ComputeNextRun(schedule.CronExpression, schedule.Timezone);
                        await configService.UpdateScheduleAfterRunAsync(schedule.Id, schedule.LastRunJobId, nextRun);
                        continue;
                    }
                }

                await FireScheduleAsync(schedule, configService, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing schedule '{Name}' (id:{Id})",
                    schedule.Name, schedule.Id);
            }
        }
    }

    private async Task FireScheduleAsync(
        ScheduleEntity schedule,
        IConfigurationDataService configService,
        CancellationToken ct)
    {
        var domains = schedule.Domain.ToLower() switch
        {
            "market" => new[] { AnalysisDomain.Market },
            "crypto" => new[] { AnalysisDomain.Crypto },
            "all" => new[] { AnalysisDomain.Market, AnalysisDomain.Crypto },
            _ => Array.Empty<AnalysisDomain>()
        };

        string lastJobId = string.Empty;

        foreach (var domain in domains)
        {
            var job = _jobTracker.CreateJob(domain);
            var message = new AnalysisJobMessage
            {
                JobId = job.Id,
                Domain = domain
            };

            await _channel.Writer.WriteAsync(message, ct);
            lastJobId = job.Id;

            _logger.LogInformation(
                "Scheduler fired {Domain} analysis job {JobId} from schedule '{ScheduleName}' (id:{ScheduleId})",
                domain, job.Id, schedule.Name, schedule.Id);
        }

        var nextRun = ComputeNextRun(schedule.CronExpression, schedule.Timezone);
        await configService.UpdateScheduleAfterRunAsync(schedule.Id, lastJobId, nextRun);

        _logger.LogInformation("Schedule '{Name}' next run at {NextRun:u}",
            schedule.Name, nextRun);
    }

    private static DateTime ComputeNextRun(string cronExpression, string timezone)
    {
        var cron = CronExpression.Parse(cronExpression);
        var tz = TimeZoneInfo.FindSystemTimeZoneById(timezone);
        var next = cron.GetNextOccurrence(DateTime.UtcNow, tz);
        return next ?? DateTime.UtcNow.AddHours(24);
    }
}
