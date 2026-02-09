namespace ScraperAgent.Data.Entities;

public class ScheduleEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CronExpression { get; set; } = string.Empty;
    public string Domain { get; set; } = "all";
    public string Timezone { get; set; } = "Europe/Madrid";
    public bool IsEnabled { get; set; } = false;
    public DateTime? LastRunAt { get; set; }
    public DateTime? NextRunAt { get; set; }
    public string? LastRunJobId { get; set; }
    public string? LastRunStatus { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
