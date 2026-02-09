namespace ScraperAgent.Models;

public class ExpertAccount
{
    public string Handle { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public int Weight { get; set; } = 5;
    public string Bias { get; set; } = string.Empty;
    public bool IsContrarian { get; set; }
}

public class Tweet
{
    public string Id { get; set; } = string.Empty;
    public string AuthorHandle { get; set; } = string.Empty;
    public string AuthorDisplayName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int LikeCount { get; set; }
    public int RetweetCount { get; set; }
    public int ReplyCount { get; set; }
    public string? QuotedTweetText { get; set; }
    public List<string> Hashtags { get; set; } = new();
    public List<string> CashTags { get; set; } = new();
    public string Url { get; set; } = string.Empty;
}

public class TweetCollection
{
    public List<Tweet> Tweets { get; set; } = new();
    public List<ExpertAccount> ExpertsQueried { get; set; } = new();
    public List<string> FailedExperts { get; set; } = new();
    public DateTime CollectedAt { get; set; } = DateTime.UtcNow;
    public int TotalTweetsCollected => Tweets.Count;
    public string DataSource { get; set; } = string.Empty;
}
