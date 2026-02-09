namespace ScraperAgent.Models;

public enum JobStatus
{
    Queued,
    Running,
    Completed,
    Failed
}

public class AnalysisJob
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public JobStatus Status { get; set; } = JobStatus.Queued;
    public AnalysisDomain Domain { get; set; } = AnalysisDomain.Market;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? ReportId { get; set; }
    public string? Error { get; set; }
}

public class AnalysisJobMessage
{
    public string JobId { get; set; } = string.Empty;
    public AnalysisDomain Domain { get; set; } = AnalysisDomain.Market;
}
