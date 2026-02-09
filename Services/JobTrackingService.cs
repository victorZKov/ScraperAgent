using System.Collections.Concurrent;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

public class JobTrackingService : IJobTrackingService
{
    private readonly ConcurrentDictionary<string, AnalysisJob> _jobs = new();

    public AnalysisJob CreateJob(AnalysisDomain domain = AnalysisDomain.Market)
    {
        var job = new AnalysisJob { Domain = domain };
        _jobs[job.Id] = job;
        return job;
    }

    public AnalysisJob? GetJob(string jobId)
    {
        _jobs.TryGetValue(jobId, out var job);
        return job;
    }

    public void MarkRunning(string jobId)
    {
        if (_jobs.TryGetValue(jobId, out var job))
            job.Status = JobStatus.Running;
    }

    public void MarkCompleted(string jobId, string reportId)
    {
        if (_jobs.TryGetValue(jobId, out var job))
        {
            job.Status = JobStatus.Completed;
            job.ReportId = reportId;
            job.CompletedAt = DateTime.UtcNow;
        }
    }

    public void MarkFailed(string jobId, string error)
    {
        if (_jobs.TryGetValue(jobId, out var job))
        {
            job.Status = JobStatus.Failed;
            job.Error = error;
            job.CompletedAt = DateTime.UtcNow;
        }
    }
}
