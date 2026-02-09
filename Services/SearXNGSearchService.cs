using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ScraperAgent.Services;

public class SearXNGSearchService : IWebSearchService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SearXNGSearchService> _logger;
    private readonly string _baseUrl;

    public SearXNGSearchService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<SearXNGSearchService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _baseUrl = configuration["SearXNG:BaseUrl"]
                   ?? Environment.GetEnvironmentVariable("SearXNG__BaseUrl")
                   ?? "http://localhost:8080";
    }

    public async Task<List<SearchResult>> SearchAsync(string query, int maxResults = 5)
    {
        var results = new List<SearchResult>();

        try
        {
            var client = _httpClientFactory.CreateClient();
            var encodedQuery = Uri.EscapeDataString(query);
            var requestUrl = $"{_baseUrl}/search?q={encodedQuery}&format=json&categories=general,news";

            _logger.LogInformation("Searching SearXNG: {Query}", query);

            var response = await client.GetAsync(requestUrl);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(json);

            if (document.RootElement.TryGetProperty("results", out var resultsArray))
            {
                foreach (var item in resultsArray.EnumerateArray())
                {
                    if (results.Count >= maxResults)
                        break;

                    results.Add(new SearchResult
                    {
                        Title = item.TryGetProperty("title", out var title) ? title.GetString() ?? string.Empty : string.Empty,
                        Url = item.TryGetProperty("url", out var url) ? url.GetString() ?? string.Empty : string.Empty,
                        Snippet = item.TryGetProperty("content", out var content) ? content.GetString() ?? string.Empty : string.Empty
                    });
                }
            }

            _logger.LogInformation("SearXNG returned {Count} results for query: {Query}", results.Count, query);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "SearXNG is unavailable. Returning empty results for query: {Query}", query);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "SearXNG request timed out for query: {Query}", query);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unexpected error querying SearXNG for: {Query}", query);
        }

        return results;
    }
}
