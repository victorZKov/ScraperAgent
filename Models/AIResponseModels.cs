using System.Text.Json.Serialization;

namespace ScraperAgent.Models;

/// <summary>
/// DTO classes for deserializing OpenAI structured JSON output.
/// These map to the JSON schema enforced via ChatResponseFormat.CreateJsonSchemaFormat().
/// </summary>
public class MarketAnalysisAIResponse
{
    [JsonPropertyName("executive_summary")]
    public string ExecutiveSummary { get; set; } = string.Empty;

    [JsonPropertyName("overall_sentiment")]
    public string OverallSentiment { get; set; } = string.Empty;

    [JsonPropertyName("sentiment_score")]
    public decimal SentimentScore { get; set; }

    [JsonPropertyName("key_themes")]
    public List<string> KeyThemes { get; set; } = new();

    [JsonPropertyName("trading_signals")]
    public List<TradingSignalDTO> TradingSignals { get; set; } = new();

    [JsonPropertyName("sector_breakdown")]
    public List<SectorAnalysisDTO> SectorBreakdown { get; set; } = new();

    [JsonPropertyName("expert_sentiments")]
    public List<ExpertSentimentDTO> ExpertSentiments { get; set; } = new();

    [JsonPropertyName("risk_factors")]
    public List<string> RiskFactors { get; set; } = new();

    [JsonPropertyName("recommendations")]
    public List<RecommendationDTO> Recommendations { get; set; } = new();
}

public class TradingSignalDTO
{
    [JsonPropertyName("ticker")]
    public string Ticker { get; set; } = string.Empty;

    [JsonPropertyName("direction")]
    public string Direction { get; set; } = string.Empty;

    [JsonPropertyName("confidence")]
    public string Confidence { get; set; } = string.Empty;

    [JsonPropertyName("timeframe")]
    public string Timeframe { get; set; } = string.Empty;

    [JsonPropertyName("rationale")]
    public string Rationale { get; set; } = string.Empty;

    [JsonPropertyName("source_experts")]
    public List<string> SourceExperts { get; set; } = new();

    [JsonPropertyName("source_tweet_urls")]
    public List<string> SourceTweetUrls { get; set; } = new();
}

public class SectorAnalysisDTO
{
    [JsonPropertyName("sector")]
    public string Sector { get; set; } = string.Empty;

    [JsonPropertyName("sentiment")]
    public string Sentiment { get; set; } = string.Empty;

    [JsonPropertyName("key_tickers")]
    public List<string> KeyTickers { get; set; } = new();

    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;
}

public class ExpertSentimentDTO
{
    [JsonPropertyName("expert_handle")]
    public string ExpertHandle { get; set; } = string.Empty;

    [JsonPropertyName("sentiment")]
    public string Sentiment { get; set; } = string.Empty;

    [JsonPropertyName("key_takeaway")]
    public string KeyTakeaway { get; set; } = string.Empty;

    [JsonPropertyName("detailed_analysis")]
    public string DetailedAnalysis { get; set; } = string.Empty;

    [JsonPropertyName("notable_calls")]
    public List<string> NotableCalls { get; set; } = new();
}

public class RecommendationDTO
{
    [JsonPropertyName("priority")]
    public int Priority { get; set; }

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty;

    [JsonPropertyName("risk_level")]
    public string RiskLevel { get; set; } = string.Empty;

    [JsonPropertyName("timeframe")]
    public string Timeframe { get; set; } = string.Empty;

    [JsonPropertyName("reasoning")]
    public string Reasoning { get; set; } = string.Empty;
}
