using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IJobTrackingService
{
    AnalysisJob CreateJob(AnalysisDomain domain = AnalysisDomain.Market);
    AnalysisJob? GetJob(string jobId);
    void MarkRunning(string jobId);
    void MarkCompleted(string jobId, string reportId);
    void MarkFailed(string jobId, string error);
}
