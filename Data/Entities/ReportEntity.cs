namespace ScraperAgent.Data.Entities;

public class ReportEntity
{
    public string Id { get; set; } = string.Empty;
    public string Domain { get; set; } = "market";
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public int TweetsAnalyzed { get; set; }
    public int ExpertsIncluded { get; set; }
    public string OverallSentiment { get; set; } = string.Empty;
    public decimal SentimentScore { get; set; }
    public string ModelUsed { get; set; } = string.Empty;
    public double DurationSeconds { get; set; }
    public string ReportJson { get; set; } = string.Empty; // Full MarketReport as JSON
}
