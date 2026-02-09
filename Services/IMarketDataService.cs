using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IMarketDataService
{
    Task<List<TickerSnapshot>> GetMarketDataAsync(List<string> tickers, AnalysisDomain domain);
}

public class TickerSnapshot
{
    public string Symbol { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Change24hPercent { get; set; }
    public decimal Volume { get; set; }
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
}
