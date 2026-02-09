using System.Collections.Concurrent;
using System.Text.Json;
using ScraperAgent.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ScraperAgent.Services;

public class MarketDataService : IMarketDataService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MarketDataService> _logger;
    private readonly string? _finnhubApiKey;

    /// <summary>
    /// In-memory cache with 5-minute TTL.
    /// </summary>
    private static readonly ConcurrentDictionary<string, (TickerSnapshot data, DateTime fetchedAt)> _cache = new();
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Maps common crypto ticker symbols to CoinGecko IDs.
    /// </summary>
    private static readonly Dictionary<string, string> CryptoTickerToGeckoId = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BTC"] = "bitcoin",
        ["ETH"] = "ethereum",
        ["SOL"] = "solana",
        ["BNB"] = "binancecoin",
        ["ADA"] = "cardano",
        ["DOT"] = "polkadot",
        ["AVAX"] = "avalanche-2",
        ["MATIC"] = "matic-network",
        ["LINK"] = "chainlink",
        ["UNI"] = "uniswap",
        ["AAVE"] = "aave",
        ["ARB"] = "arbitrum",
        ["OP"] = "optimism",
        ["DOGE"] = "dogecoin",
        ["XRP"] = "ripple",
        ["ATOM"] = "cosmos",
        ["NEAR"] = "near",
        ["FTM"] = "fantom",
        ["APT"] = "aptos",
        ["SUI"] = "sui",
        ["SHIB"] = "shiba-inu",
        ["LTC"] = "litecoin",
        ["TRX"] = "tron",
        ["PEPE"] = "pepe",
        ["INJ"] = "injective-protocol",
        ["SEI"] = "sei-network",
        ["TIA"] = "celestia",
        ["STX"] = "blockstack",
        ["RENDER"] = "render-token",
        ["FET"] = "fetch-ai",
    };

    public MarketDataService(
        IHttpClientFactory httpClientFactory,
        ILogger<MarketDataService> logger,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _finnhubApiKey = configuration["Finnhub:ApiKey"]
                         ?? Environment.GetEnvironmentVariable("Finnhub__ApiKey")
                         ?? Environment.GetEnvironmentVariable("Finnhub_ApiKey");
    }

    public async Task<List<TickerSnapshot>> GetMarketDataAsync(List<string> tickers, AnalysisDomain domain)
    {
        if (tickers == null || tickers.Count == 0)
            return new List<TickerSnapshot>();

        try
        {
            return domain == AnalysisDomain.Crypto
                ? await FetchCryptoDataAsync(tickers)
                : await FetchEquityDataAsync(tickers);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch market data for {Domain}, returning empty list", domain);
            return new List<TickerSnapshot>();
        }
    }

    private async Task<List<TickerSnapshot>> FetchCryptoDataAsync(List<string> tickers)
    {
        var results = new List<TickerSnapshot>();

        // Check cache first, collect uncached tickers
        var uncachedTickers = new List<string>();
        foreach (var ticker in tickers.Take(20))
        {
            var symbol = ticker.TrimStart('$').ToUpperInvariant();
            var cacheKey = $"crypto:{symbol}";

            if (_cache.TryGetValue(cacheKey, out var cached) && DateTime.UtcNow - cached.fetchedAt < CacheTtl)
            {
                results.Add(cached.data);
            }
            else
            {
                uncachedTickers.Add(symbol);
            }
        }

        if (uncachedTickers.Count == 0)
            return results;

        // Map tickers to CoinGecko IDs
        var geckoMappings = new Dictionary<string, string>(); // geckoId -> original symbol
        foreach (var symbol in uncachedTickers)
        {
            if (CryptoTickerToGeckoId.TryGetValue(symbol, out var geckoId))
            {
                geckoMappings[geckoId] = symbol;
            }
            else
            {
                _logger.LogDebug("No CoinGecko mapping for ticker {Ticker}, skipping", symbol);
            }
        }

        if (geckoMappings.Count == 0)
            return results;

        try
        {
            var client = _httpClientFactory.CreateClient();
            var ids = string.Join(",", geckoMappings.Keys);
            var url = $"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true";

            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            foreach (var (geckoId, symbol) in geckoMappings)
            {
                if (doc.RootElement.TryGetProperty(geckoId, out var coinData))
                {
                    var snapshot = new TickerSnapshot
                    {
                        Symbol = symbol,
                        Price = coinData.TryGetProperty("usd", out var usd) ? usd.GetDecimal() : 0,
                        Change24hPercent = coinData.TryGetProperty("usd_24h_change", out var change)
                            ? Math.Round(change.GetDecimal(), 2) : 0,
                        Volume = coinData.TryGetProperty("usd_24h_vol", out var vol) ? vol.GetDecimal() : 0,
                        FetchedAt = DateTime.UtcNow
                    };

                    results.Add(snapshot);
                    _cache[$"crypto:{symbol}"] = (snapshot, DateTime.UtcNow);
                }
            }

            _logger.LogInformation("Fetched crypto data for {Count} tokens from CoinGecko", geckoMappings.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CoinGecko API call failed");
        }

        return results;
    }

    private async Task<List<TickerSnapshot>> FetchEquityDataAsync(List<string> tickers)
    {
        var results = new List<TickerSnapshot>();

        if (string.IsNullOrEmpty(_finnhubApiKey))
        {
            _logger.LogWarning("Finnhub API key not configured, skipping equity market data");
            return results;
        }

        // Take top 10 most mentioned tickers
        var tickersToFetch = tickers.Take(10).ToList();
        var client = _httpClientFactory.CreateClient();

        foreach (var ticker in tickersToFetch)
        {
            var symbol = ticker.TrimStart('$').ToUpperInvariant();
            var cacheKey = $"equity:{symbol}";

            // Check cache
            if (_cache.TryGetValue(cacheKey, out var cached) && DateTime.UtcNow - cached.fetchedAt < CacheTtl)
            {
                results.Add(cached.data);
                continue;
            }

            try
            {
                var url = $"https://finnhub.io/api/v1/quote?symbol={symbol}&token={_finnhubApiKey}";
                var response = await client.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var currentPrice = root.TryGetProperty("c", out var c) ? c.GetDecimal() : 0;

                // Skip if no valid price returned (unknown ticker)
                if (currentPrice == 0)
                {
                    _logger.LogDebug("No price data for ticker {Ticker}, skipping", symbol);
                    continue;
                }

                var snapshot = new TickerSnapshot
                {
                    Symbol = symbol,
                    Price = currentPrice,
                    Change24hPercent = root.TryGetProperty("dp", out var dp) ? Math.Round(dp.GetDecimal(), 2) : 0,
                    Volume = root.TryGetProperty("v", out var v) ? v.GetDecimal() : 0,
                    FetchedAt = DateTime.UtcNow
                };

                results.Add(snapshot);
                _cache[cacheKey] = (snapshot, DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Finnhub API call failed for ticker {Ticker}", symbol);
            }

            // Rate limiting: 100ms delay between sequential calls
            await Task.Delay(100);
        }

        _logger.LogInformation("Fetched equity data for {Count}/{Total} tickers from Finnhub",
            results.Count, tickersToFetch.Count);

        return results;
    }
}
