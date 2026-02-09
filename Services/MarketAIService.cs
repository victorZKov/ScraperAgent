using System.Collections.Concurrent;
using System.Text.Json;
using Azure;
using Azure.AI.OpenAI;
using ScraperAgent.Data.Entities;
using ScraperAgent.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;

namespace ScraperAgent.Services;

public class MarketAIService : IMarketAIService
{
    private readonly IConfigurationDataService _configService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MarketAIService> _logger;
    private static readonly ConcurrentDictionary<string, AzureOpenAIClient> _clientCache = new();

    /// <summary>
    /// JSON Schema for OpenAI structured outputs (strict mode).
    /// Every object has "additionalProperties": false and all properties in "required".
    /// </summary>
    private static readonly byte[] AnalysisJsonSchema = JsonSerializer.SerializeToUtf8Bytes(new
    {
        type = "object",
        properties = new Dictionary<string, object>
        {
            ["executive_summary"] = new { type = "string", description = "4-6 sentences capturing the dominant market narrative, key divergences, and most actionable intelligence." },
            ["overall_sentiment"] = new { type = "string", @enum = new[] { "VERY_BEARISH", "BEARISH", "NEUTRAL", "BULLISH", "VERY_BULLISH" } },
            ["sentiment_score"] = new { type = "number", description = "Decimal from -1.0 to 1.0 representing overall sentiment." },
            ["key_themes"] = new { type = "array", items = new { type = "string" }, description = "5+ key themes, each 2-3 sentences with specific expert references." },
            ["trading_signals"] = new
            {
                type = "array",
                items = new
                {
                    type = "object",
                    properties = new Dictionary<string, object>
                    {
                        ["ticker"] = new { type = "string" },
                        ["direction"] = new { type = "string", @enum = new[] { "STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL" } },
                        ["confidence"] = new { type = "string", @enum = new[] { "HIGH", "MEDIUM", "LOW" } },
                        ["timeframe"] = new { type = "string" },
                        ["rationale"] = new { type = "string" },
                        ["source_experts"] = new { type = "array", items = new { type = "string" } },
                        ["source_tweet_urls"] = new { type = "array", items = new { type = "string" }, description = "URLs of the specific tweets that support this signal" }
                    },
                    required = new[] { "ticker", "direction", "confidence", "timeframe", "rationale", "source_experts", "source_tweet_urls" },
                    additionalProperties = false
                },
                description = "10 trading signals with specific tickers, ordered by conviction strength."
            },
            ["sector_breakdown"] = new
            {
                type = "array",
                items = new
                {
                    type = "object",
                    properties = new Dictionary<string, object>
                    {
                        ["sector"] = new { type = "string" },
                        ["sentiment"] = new { type = "string", @enum = new[] { "VERY_BEARISH", "BEARISH", "NEUTRAL", "BULLISH", "VERY_BULLISH" } },
                        ["key_tickers"] = new { type = "array", items = new { type = "string" } },
                        ["summary"] = new { type = "string" }
                    },
                    required = new[] { "sector", "sentiment", "key_tickers", "summary" },
                    additionalProperties = false
                },
                description = "4-6 sector analyses."
            },
            ["expert_sentiments"] = new
            {
                type = "array",
                items = new
                {
                    type = "object",
                    properties = new Dictionary<string, object>
                    {
                        ["expert_handle"] = new { type = "string" },
                        ["sentiment"] = new { type = "string", @enum = new[] { "VERY_BEARISH", "BEARISH", "NEUTRAL", "BULLISH", "VERY_BULLISH" } },
                        ["key_takeaway"] = new { type = "string" },
                        ["detailed_analysis"] = new { type = "string" },
                        ["notable_calls"] = new { type = "array", items = new { type = "string" } }
                    },
                    required = new[] { "expert_handle", "sentiment", "key_takeaway", "detailed_analysis", "notable_calls" },
                    additionalProperties = false
                },
                description = "Sentiment analysis for every expert in the dataset."
            },
            ["risk_factors"] = new { type = "array", items = new { type = "string" }, description = "4+ risk factors, each 2-3 sentences." },
            ["recommendations"] = new
            {
                type = "array",
                items = new
                {
                    type = "object",
                    properties = new Dictionary<string, object>
                    {
                        ["priority"] = new { type = "integer" },
                        ["action"] = new { type = "string" },
                        ["risk_level"] = new { type = "string", @enum = new[] { "LOW", "MEDIUM", "HIGH" } },
                        ["timeframe"] = new { type = "string" },
                        ["reasoning"] = new { type = "string" }
                    },
                    required = new[] { "priority", "action", "risk_level", "timeframe", "reasoning" },
                    additionalProperties = false
                },
                description = "10 priority-ordered actionable recommendations."
            }
        },
        required = new[] { "executive_summary", "overall_sentiment", "sentiment_score", "key_themes", "trading_signals", "sector_breakdown", "expert_sentiments", "risk_factors", "recommendations" },
        additionalProperties = false
    });

    public MarketAIService(
        ILogger<MarketAIService> logger,
        IConfiguration configuration,
        IConfigurationDataService configService)
    {
        _logger = logger;
        _configuration = configuration;
        _configService = configService;
    }

    private (AzureOpenAIClient client, string deployment) GetAIClient(AIModelEntity? model)
    {
        if (model != null && !string.IsNullOrEmpty(model.Endpoint) && !string.IsNullOrEmpty(model.ApiKey))
        {
            var cacheKey = $"{model.Endpoint}:{model.ApiKey.GetHashCode()}";
            var client = _clientCache.GetOrAdd(cacheKey, _ =>
                new AzureOpenAIClient(new Uri(model.Endpoint), new AzureKeyCredential(model.ApiKey)));
            return (client, model.DeploymentName);
        }

        // Fallback to config
        var endpoint = _configuration["AzureOpenAI:Endpoint"]
                       ?? Environment.GetEnvironmentVariable("AzureOpenAI__Endpoint");
        var apiKey = _configuration["AzureOpenAI:ApiKey"]
                     ?? Environment.GetEnvironmentVariable("AzureOpenAI__ApiKey");
        var deployment = _configuration["AzureOpenAI:DeploymentName"]
                         ?? Environment.GetEnvironmentVariable("AzureOpenAI__DeploymentName")
                         ?? "gpt-4o-mini";

        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(apiKey))
            return (null!, deployment);

        var fallbackKey = $"{endpoint}:{apiKey.GetHashCode()}";
        var fallbackClient = _clientCache.GetOrAdd(fallbackKey, _ =>
            new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey)));
        return (fallbackClient, deployment);
    }

    public Task<MarketAnalysisResult> AnalyzeTweetsAsync(TweetCollection tweets)
        => AnalyzeTweetsAsync(tweets, AnalysisDomain.Market, null, null);

    public Task<MarketAnalysisResult> AnalyzeTweetsAsync(TweetCollection tweets, AnalysisDomain domain)
        => AnalyzeTweetsAsync(tweets, domain, null, null);

    public async Task<MarketAnalysisResult> AnalyzeTweetsAsync(
        TweetCollection tweets, AnalysisDomain domain, List<TickerSnapshot>? marketData = null, List<SearchResult>? webSearchResults = null)
    {
        var domainStr = domain == AnalysisDomain.Crypto ? "crypto" : "market";
        var model = await _configService.GetDefaultAIModelAsync(domainStr);
        var (client, deploymentName) = GetAIClient(model);

        if (model != null)
            _logger.LogInformation("Using configured AI model: {Name} (deployment: {Deployment}, domain: {Domain})",
                model.Name, model.DeploymentName, model.Domain);
        else
            _logger.LogInformation("No configured AI model found for domain '{Domain}', falling back to appsettings (deployment: {Deployment})",
                domainStr, deploymentName);

        if (client == null)
        {
            _logger.LogWarning("Azure OpenAI client not configured. Returning default analysis.");
            return GetDefaultAnalysis(tweets, domain);
        }

        try
        {
            var prompt = BuildPrompt(tweets, domain, marketData, webSearchResults);
            _logger.LogInformation("Prompt size: {Chars} chars (~{Tokens}K tokens) for {Domain} analysis",
                prompt.Length, prompt.Length / 4000, domain);

            var chatClient = client.GetChatClient(deploymentName);

            var systemPrompt = domain == AnalysisDomain.Crypto
                ? GetCryptoSystemPrompt()
                : GetSystemPrompt();

            // o-series reasoning models (o1, o3, o3-mini, o4-mini) do not support Temperature
            var isReasoningModel = IsReasoningModel(deploymentName, model?.Name);
            if (isReasoningModel)
                _logger.LogInformation("Detected reasoning model — skipping Temperature parameter");

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(prompt)
            };

            var options = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 12000,
                ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat(
                    "market_analysis",
                    BinaryData.FromBytes(AnalysisJsonSchema),
                    jsonSchemaIsStrict: true)
            };

            if (!isReasoningModel)
                options.Temperature = 0.4f;

            _logger.LogInformation("Calling AI model (deployment: {Deployment})...", deploymentName);
            var response = await chatClient.CompleteChatAsync(messages, options);
            var content = response.Value.Content[0].Text;

            _logger.LogInformation("AI {Domain} analysis generated successfully. Response length: {Len} chars, FinishReason: {Reason}",
                domain, content.Length, response.Value.FinishReason);

            return ParseAIResponse(content, tweets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI {Domain} analysis: {Message}", domain, ex.Message);
            var fallback = GetDefaultAnalysis(tweets, domain);
            fallback.RawAIResponse = $"AI ERROR: {ex.GetType().Name}: {ex.Message}";
            return fallback;
        }
    }

    private string GetSystemPrompt()
    {
        return @"You are a senior financial market analyst specializing in social media intelligence and sentiment analysis. You analyze tweets from financial experts, traders, and market commentators to extract actionable market intelligence.

Your analysis must be:
1. DATA-DRIVEN: Base every conclusion on specific tweets and expert opinions you can reference. Quote tweets directly when relevant.
2. ACTIONABLE: Provide specific trading recommendations with tickers, direction, confidence levels, and timeframes.
3. BALANCED: Present both bullish and bearish perspectives honestly.
4. RISK-AWARE: Always include risk factors and caveats.
5. DENSE: Be thorough and detailed. Each section should provide substantial analysis, not just surface-level summaries.

You must respond with a JSON object matching the provided schema. Be thorough and detailed in every field.

When market data is provided, incorporate real-time price levels, percentage changes, and volume into your analysis. Reference specific price levels and moves in your signals and recommendations.

When recent news headlines are provided, cross-reference them with expert sentiment. Note where expert opinions align with or diverge from current news narratives.

Expert metadata: Each expert has a Weight (1-10, higher = more influential), an optional Bias (their known market stance), and a Contrarian flag. Experts marked CONTRARIAN historically go against market consensus — consider their opinion as a potential counter-signal and note this in your analysis.

For each trading_signal, include source_tweet_urls as full URLs. Each tweet has a compact reference like T:1234567890 — construct the full URL as https://x.com/{expert_handle}/status/{tweet_id}.

IMPORTANT: This analysis is based on social media sentiment, not fundamental or technical analysis. Always emphasize that users should perform their own due diligence before trading. This is for informational purposes only, not financial advice.";
    }

    private string GetCryptoSystemPrompt()
    {
        return @"You are a senior cryptocurrency and digital asset analyst specializing in social media intelligence, on-chain data interpretation, and crypto market sentiment analysis. You analyze tweets from crypto experts, traders, analysts, and on-chain researchers to extract actionable crypto market intelligence.

Your analysis must be:
1. DATA-DRIVEN: Base every conclusion on specific tweets and expert opinions you can reference. Quote tweets directly when relevant.
2. ACTIONABLE: Provide specific trading recommendations with token/coin symbols, direction, confidence levels, and timeframes.
3. BALANCED: Present both bullish and bearish perspectives honestly.
4. RISK-AWARE: Always include risk factors including regulatory, smart contract, liquidity, and exchange risks.
5. DENSE: Be thorough and detailed. Each section should provide substantial analysis, not just surface-level summaries.

You must respond with a JSON object matching the provided schema. Be thorough and detailed in every field.

When market data is provided, incorporate real-time price levels, percentage changes, and volume into your analysis. Reference specific price levels and moves in your signals and recommendations. Cover BTC dominance trends, altcoin momentum, DeFi activity, and major protocol developments.

When recent news headlines are provided, cross-reference them with expert sentiment. Note where expert opinions align with or diverge from current news narratives.

Expert metadata: Each expert has a Weight (1-10, higher = more influential), an optional Bias (their known market stance), and a Contrarian flag. Experts marked CONTRARIAN historically go against market consensus — consider their opinion as a potential counter-signal and note this in your analysis.

For each trading_signal, include source_tweet_urls with the actual tweet URLs that support the signal. Each tweet in the data includes its URL — reference them directly.

IMPORTANT: Crypto markets operate 24/7 with extreme volatility. This analysis is based on social media sentiment, not on-chain analytics or technical analysis. Always emphasize DYOR. Never invest more than you can afford to lose. This is for informational purposes only, not financial advice.";
    }

    private string BuildPrompt(TweetCollection tweets, AnalysisDomain domain, List<TickerSnapshot>? marketData = null, List<SearchResult>? webSearchResults = null)
    {
        var tweetsByExpert = tweets.Tweets
            .GroupBy(t => t.AuthorHandle)
            .OrderByDescending(g => g.Sum(t => t.LikeCount + t.RetweetCount));

        var allCashTags = tweets.Tweets
            .SelectMany(t => t.CashTags)
            .GroupBy(c => c)
            .OrderByDescending(g => g.Count())
            .Select(g => $"{g.Key} ({g.Count()} mentions)")
            .ToList();

        var expertType = domain == AnalysisDomain.Crypto ? "crypto experts" : "financial experts";
        var tickerLabel = domain == AnalysisDomain.Crypto ? "MOST MENTIONED TOKENS" : "MOST MENTIONED TICKERS";

        var prompt = $@"Analyze the following {tweets.TotalTweetsCollected} tweets from {tweets.ExpertsQueried.Count} {expertType}, collected at {tweets.CollectedAt:yyyy-MM-dd HH:mm} UTC.

{tickerLabel}: {string.Join(", ", allCashTags.Take(15))}
";

        // Append market data section if available
        if (marketData != null && marketData.Count > 0)
        {
            var fetchTime = marketData.First().FetchedAt;
            prompt += $@"
CURRENT MARKET DATA (as of {fetchTime:HH:mm} UTC):
";
            foreach (var snap in marketData)
            {
                var changeSign = snap.Change24hPercent >= 0 ? "+" : "";
                var volumeStr = FormatVolume(snap.Volume);
                prompt += $"${snap.Symbol}: ${snap.Price:N2} ({changeSign}{snap.Change24hPercent:F2}% 24h, Vol: {volumeStr})\n";
            }
        }

        // Append web search results if available
        if (webSearchResults != null && webSearchResults.Count > 0)
        {
            prompt += @"
RECENT NEWS & WEB CONTEXT:
";
            foreach (var result in webSearchResults)
            {
                prompt += $"- {result.Title}: {result.Snippet}\n";
            }
        }

        prompt += @"
TWEETS BY EXPERT:
(Each tweet has an ID ref like [T123] — use these to construct source_tweet_urls as https://x.com/{handle}/status/{id})
";

        // Limit tweets per expert to keep prompt within context window
        const int maxTweetsPerExpert = 20;

        foreach (var group in tweetsByExpert)
        {
            var expert = tweets.ExpertsQueried.FirstOrDefault(e => e.Handle == group.Key);
            var category = expert?.Category ?? "Unknown";
            var weight = expert?.Weight ?? 5;
            var meta = $"Weight: {weight}/10";
            if (!string.IsNullOrEmpty(expert?.Bias))
                meta += $", Bias: {expert.Bias}";
            if (expert?.IsContrarian == true)
                meta += ", ⚠️ CONTRARIAN";

            var expertTweets = group.OrderByDescending(t => t.LikeCount + t.RetweetCount).Take(maxTweetsPerExpert).ToList();
            var totalForExpert = group.Count();
            var shownLabel = totalForExpert > maxTweetsPerExpert ? $" (top {maxTweetsPerExpert} of {totalForExpert} by engagement)" : "";

            prompt += $@"
--- @{group.Key} ({expert?.DisplayName ?? group.Key}) [{category}] — {meta}{shownLabel} ---
";
            foreach (var tweet in expertTweets.OrderByDescending(t => t.CreatedAt))
            {
                var age = (tweets.CollectedAt - tweet.CreatedAt).TotalHours;
                // Extract tweet ID from URL for compact reference
                var tweetId = tweet.Url?.Split('/').LastOrDefault() ?? "";
                prompt += $"[{age:F0}h ago | {tweet.LikeCount} likes | {tweet.RetweetCount} RTs | T:{tweetId}] {tweet.Text}\n";
            }
        }

        var timeHorizon = domain == AnalysisDomain.Crypto ? "next 24-72 hours" : "next 3-5 trading days";
        prompt += $@"

Please provide your complete analysis as a JSON object matching the schema. Focus on:
1. What is the consensus view among these experts for the {timeHorizon}?
2. Where are the strongest conviction signals (both bullish and bearish)?
3. What specific actions should a trader consider based on this intelligence?
4. What are the key risk events to watch?

IMPORTANT: You MUST provide EXACTLY 10 trading_signals and EXACTLY 10 recommendations. If you cannot find 10 high-conviction signals, include lower-confidence ones. Cover different tickers, sectors, and timeframes. Every expert should be analyzed in expert_sentiments.";

        return prompt;
    }

    private static bool IsReasoningModel(string deploymentName, string? modelName = null)
    {
        var names = new[] { deploymentName, modelName ?? "" };
        return names.Any(n =>
        {
            var lower = n.ToLowerInvariant();
            return lower.Contains("o1") || lower.Contains("o3") || lower.Contains("o4");
        });
    }

    private static string FormatVolume(decimal volume)
    {
        if (volume >= 1_000_000_000m)
            return $"${volume / 1_000_000_000m:F1}B";
        if (volume >= 1_000_000m)
            return $"${volume / 1_000_000m:F1}M";
        if (volume >= 1_000m)
            return $"${volume / 1_000m:F1}K";
        return $"${volume:F0}";
    }

    private MarketAnalysisResult ParseAIResponse(string response, TweetCollection tweets)
    {
        try
        {
            var dto = JsonSerializer.Deserialize<MarketAnalysisAIResponse>(response);
            if (dto == null)
            {
                _logger.LogWarning("AI response deserialized to null, returning default analysis");
                return GetDefaultAnalysis(tweets);
            }

            return MapDtoToResult(dto, response);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize AI JSON response, returning default analysis");
            return GetDefaultAnalysis(tweets);
        }
    }

    private static MarketAnalysisResult MapDtoToResult(MarketAnalysisAIResponse dto, string rawResponse)
    {
        var result = new MarketAnalysisResult
        {
            RawAIResponse = rawResponse,
            ExecutiveSummary = dto.ExecutiveSummary,
            OverallSentiment = ParseSentimentEnum(dto.OverallSentiment),
            SentimentScore = Math.Clamp(dto.SentimentScore, -1.0m, 1.0m),
            KeyThemes = dto.KeyThemes,
            RiskFactors = dto.RiskFactors,
            Timeframe = "Next 3-5 trading days"
        };

        foreach (var sig in dto.TradingSignals)
        {
            result.TradingSignals.Add(new TradingSignal
            {
                Ticker = sig.Ticker.TrimStart('$'),
                Direction = ParseDirectionEnum(sig.Direction),
                Confidence = sig.Confidence,
                Timeframe = sig.Timeframe,
                Rationale = sig.Rationale,
                SourceExperts = sig.SourceExperts,
                SourceTweetUrls = sig.SourceTweetUrls
            });
        }

        foreach (var sec in dto.SectorBreakdown)
        {
            result.SectorBreakdown.Add(new SectorAnalysis
            {
                Sector = sec.Sector,
                Sentiment = ParseSentimentEnum(sec.Sentiment),
                KeyTickers = sec.KeyTickers,
                Summary = sec.Summary
            });
        }

        foreach (var exp in dto.ExpertSentiments)
        {
            result.ExpertSentiments.Add(new ExpertSentiment
            {
                ExpertHandle = exp.ExpertHandle.TrimStart('@'),
                Sentiment = ParseSentimentEnum(exp.Sentiment),
                KeyTakeaway = exp.KeyTakeaway,
                DetailedAnalysis = exp.DetailedAnalysis,
                NotableCalls = exp.NotableCalls
            });
        }

        foreach (var rec in dto.Recommendations)
        {
            result.Recommendations.Add(new ActionableRecommendation
            {
                Priority = rec.Priority,
                Action = rec.Action,
                RiskLevel = rec.RiskLevel,
                Timeframe = rec.Timeframe,
                Reasoning = rec.Reasoning
            });
        }

        return result;
    }

    private static MarketSentiment ParseSentimentEnum(string value)
    {
        return (value ?? "").Trim().ToUpperInvariant() switch
        {
            "VERY_BEARISH" or "VERY BEARISH" => MarketSentiment.VeryBearish,
            "BEARISH" => MarketSentiment.Bearish,
            "NEUTRAL" => MarketSentiment.Neutral,
            "BULLISH" => MarketSentiment.Bullish,
            "VERY_BULLISH" or "VERY BULLISH" => MarketSentiment.VeryBullish,
            _ => MarketSentiment.Neutral
        };
    }

    private static SignalDirection ParseDirectionEnum(string value)
    {
        return (value ?? "").Trim().ToUpperInvariant() switch
        {
            "STRONG_BUY" or "STRONG BUY" => SignalDirection.StrongBuy,
            "BUY" => SignalDirection.Buy,
            "HOLD" => SignalDirection.Hold,
            "SELL" => SignalDirection.Sell,
            "STRONG_SELL" or "STRONG SELL" => SignalDirection.StrongSell,
            _ => SignalDirection.Hold
        };
    }

    private MarketAnalysisResult GetDefaultAnalysis(TweetCollection tweets, AnalysisDomain domain = AnalysisDomain.Market)
    {
        var allCashTags = tweets.Tweets
            .SelectMany(t => t.CashTags)
            .GroupBy(c => c)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => g.Key)
            .ToList();

        var expertType = domain == AnalysisDomain.Crypto ? "crypto experts" : "financial experts";
        var tickerLabel = domain == AnalysisDomain.Crypto ? "tokens" : "tickers";

        return new MarketAnalysisResult
        {
            ExecutiveSummary = $"Analysis of {tweets.TotalTweetsCollected} tweets from {tweets.ExpertsQueried.Count} {expertType}. " +
                               $"Most discussed {tickerLabel}: {string.Join(", ", allCashTags)}. " +
                               "AI analysis unavailable - showing raw data summary only.",
            OverallSentiment = MarketSentiment.Neutral,
            SentimentScore = 0,
            KeyThemes = new List<string>
            {
                $"Total tweets analyzed: {tweets.TotalTweetsCollected}",
                $"Experts included: {tweets.ExpertsQueried.Count}",
                $"Top tickers: {string.Join(", ", allCashTags)}"
            },
            RiskFactors = new List<string>
            {
                "AI analysis was unavailable - this is a raw data summary only",
                "Always perform your own due diligence before trading"
            },
            Recommendations = new List<ActionableRecommendation>
            {
                new()
                {
                    Priority = 1,
                    Action = "Review the raw tweet data manually",
                    Reasoning = "AI analysis service was not available",
                    RiskLevel = "N/A",
                    Timeframe = "Immediate"
                }
            },
            Timeframe = "Next 3-5 trading days"
        };
    }
}
