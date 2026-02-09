using ScraperAgent.Models;

namespace ScraperAgent.Configuration;

public class ExpertAccountsOptions
{
    public const string SectionName = "ExpertAccounts";

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

public class ExpertAccountEntry
{
    public string Handle { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = true;
}
