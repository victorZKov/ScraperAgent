namespace ScraperAgent.Models;

public enum AnalysisDomain
{
    Market,
    Crypto
}

public class MarketAnalysisResult
{
    public string ExecutiveSummary { get; set; } = string.Empty;
    public MarketSentiment OverallSentiment { get; set; }
    public decimal SentimentScore { get; set; }
    public List<TradingSignal> TradingSignals { get; set; } = new();
    public List<SectorAnalysis> SectorBreakdown { get; set; } = new();
    public List<ExpertSentiment> ExpertSentiments { get; set; } = new();
    public List<string> KeyThemes { get; set; } = new();
    public List<string> RiskFactors { get; set; } = new();
    public List<ActionableRecommendation> Recommendations { get; set; } = new();
    public string RawAIResponse { get; set; } = string.Empty;
    public string Timeframe { get; set; } = string.Empty;
}

public enum MarketSentiment
{
    VeryBearish,
    Bearish,
    Neutral,
    Bullish,
    VeryBullish
}

public class TradingSignal
{
    public string Ticker { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public SignalDirection Direction { get; set; }
    public string Confidence { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string Timeframe { get; set; } = string.Empty;
    public List<string> SourceExperts { get; set; } = new();
    public List<string> SourceTweetUrls { get; set; } = new();
}

public enum SignalDirection
{
    StrongBuy,
    Buy,
    Hold,
    Sell,
    StrongSell
}

public class SectorAnalysis
{
    public string Sector { get; set; } = string.Empty;
    public MarketSentiment Sentiment { get; set; }
    public string Summary { get; set; } = string.Empty;
    public List<string> KeyTickers { get; set; } = new();
}

public class ExpertSentiment
{
    public string ExpertHandle { get; set; } = string.Empty;
    public string ExpertName { get; set; } = string.Empty;
    public MarketSentiment Sentiment { get; set; }
    public string KeyTakeaway { get; set; } = string.Empty;
    public string DetailedAnalysis { get; set; } = string.Empty;
    public List<string> NotableCalls { get; set; } = new();
    public int TweetCount { get; set; }
}

public class ActionableRecommendation
{
    public int Priority { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Reasoning { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public string Timeframe { get; set; } = string.Empty;
}
