using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface ITweetScraperService
{
    Task<TweetCollection> GetExpertTweetsAsync(int maxTweetsPerUser = 50, int hoursBack = 72);
    Task<TweetCollection> GetExpertTweetsAsync(List<ExpertAccount> experts, int maxTweetsPerUser = 50, int hoursBack = 72);
}
