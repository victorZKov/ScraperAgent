namespace ScraperAgent.Models;

public class MarketReport
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public AnalysisDomain Domain { get; set; } = AnalysisDomain.Market;
    public TweetCollection TweetData { get; set; } = new();
    public MarketAnalysisResult Analysis { get; set; } = new();
    public bool EmailSent { get; set; }
    public List<string> EmailRecipients { get; set; } = new();
    public string ModelUsed { get; set; } = string.Empty;
    public double DurationSeconds { get; set; }
    public List<MarketDataSnapshot> MarketData { get; set; } = new();
    public List<WebSource> WebSources { get; set; } = new();
}

public class MarketDataSnapshot
{
    public string Symbol { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Change24hPercent { get; set; }
    public decimal Volume { get; set; }
}

public class WebSource
{
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
}

public class ReportMetadata
{
    public string Id { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public AnalysisDomain Domain { get; set; } = AnalysisDomain.Market;
    public int TweetsAnalyzed { get; set; }
    public int ExpertsIncluded { get; set; }
    public string OverallSentiment { get; set; } = string.Empty;
    public decimal SentimentScore { get; set; }
    public string ModelUsed { get; set; } = string.Empty;
    public double DurationSeconds { get; set; }
}
