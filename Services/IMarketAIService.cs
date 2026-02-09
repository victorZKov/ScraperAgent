using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IMarketAIService
{
    Task<MarketAnalysisResult> AnalyzeTweetsAsync(TweetCollection tweets);
    Task<MarketAnalysisResult> AnalyzeTweetsAsync(TweetCollection tweets, AnalysisDomain domain);
    Task<MarketAnalysisResult> AnalyzeTweetsAsync(TweetCollection tweets, AnalysisDomain domain, List<TickerSnapshot>? marketData = null, List<SearchResult>? webSearchResults = null);
}
