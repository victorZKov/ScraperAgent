using ScraperAgent.Models;
using Microsoft.Extensions.Options;

namespace ScraperAgent.Configuration;

public static class DefaultExpertAccounts
{
    public static List<ExpertAccount> GetDefaults() => new()
    {
        // TV / Media Analysts
        new() { Handle = "jimcramer", DisplayName = "Jim Cramer", Category = "TV Analyst", IsVerified = true },
        new() { Handle = "lisaabramowicz1", DisplayName = "Lisa Abramowicz", Category = "TV Analyst", IsVerified = true },

        // Breaking Financial News
        new() { Handle = "FirstSquawk", DisplayName = "First Squawk", Category = "Breaking News", IsVerified = true },
        new() { Handle = "DeItaone", DisplayName = "Walter Bloomberg", Category = "Breaking News", IsVerified = true },
        new() { Handle = "markets", DisplayName = "Bloomberg Markets", Category = "Breaking News", IsVerified = true },

        // Macro / Fund Managers
        new() { Handle = "elerianm", DisplayName = "Mohamed El-Erian", Category = "Macro Strategist", IsVerified = true },
        new() { Handle = "CathieDWood", DisplayName = "Cathie Wood", Category = "Fund Manager", IsVerified = true },
        new() { Handle = "PeterSchiff", DisplayName = "Peter Schiff", Category = "Macro Strategist", IsVerified = true },

        // Options / Flow
        new() { Handle = "unusual_whales", DisplayName = "Unusual Whales", Category = "Options Flow", IsVerified = true },
    };

    /// <summary>
    /// Returns expert accounts from configuration if available, otherwise falls back to hardcoded defaults.
    /// </summary>
    public static List<ExpertAccount> GetFromOptions(IOptions<ExpertAccountsOptions> options)
    {
        var configured = options.Value.Accounts;
        if (configured.Count > 0)
            return options.Value.ToExpertAccounts();

        return GetDefaults();
    }
}
