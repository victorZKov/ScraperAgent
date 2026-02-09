using ScraperAgent.Models;

namespace ScraperAgent.Configuration;

public class CryptoExpertAccountsOptions
{
    public const string SectionName = "CryptoExpertAccounts";

    public List<ExpertAccountEntry> Accounts { get; set; } = new();

    public List<ExpertAccount> ToExpertAccounts() =>
        Accounts.Select(a => new ExpertAccount
        {
            Handle = a.Handle,
            DisplayName = a.DisplayName,
            Category = a.Category,
            IsVerified = a.IsVerified
        }).ToList();
}
