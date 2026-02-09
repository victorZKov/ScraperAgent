namespace ScraperAgent.Services;

public interface IWebSearchService
{
    Task<List<SearchResult>> SearchAsync(string query, int maxResults = 5);
}

public class SearchResult
{
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
}
