using ScraperAgent.Models;
using Microsoft.Extensions.Options;

namespace ScraperAgent.Configuration;

public static class DefaultCryptoExpertAccounts
{
    public static List<ExpertAccount> GetDefaults() => new()
    {
        // On-Chain Data / Whale Tracking
        new() { Handle = "whale_alert", DisplayName = "Whale Alert", Category = "On-Chain Data", IsVerified = true },
        new() { Handle = "lookonchain", DisplayName = "Lookonchain", Category = "On-Chain Analytics", IsVerified = true },

        // Crypto News
        new() { Handle = "WatcherGuru", DisplayName = "Watcher Guru", Category = "Crypto News", IsVerified = true },
        new() { Handle = "WuBlockchain", DisplayName = "Wu Blockchain", Category = "Crypto News", IsVerified = true },

        // Analysts / Traders
        new() { Handle = "100trillionUSD", DisplayName = "PlanB", Category = "Crypto Analyst", IsVerified = true },
        new() { Handle = "CryptoCobain", DisplayName = "Cobie", Category = "Crypto Trader", IsVerified = true },
        new() { Handle = "inversebrah", DisplayName = "inversebrah", Category = "Crypto Trader", IsVerified = true },

        // DeFi / Research
        new() { Handle = "DefiIgnas", DisplayName = "Ignas", Category = "DeFi Research", IsVerified = true },
        new() { Handle = "milesdeutscher", DisplayName = "Miles Deutscher", Category = "Crypto Analyst", IsVerified = true },
        new() { Handle = "AltcoinGordon", DisplayName = "Altcoin Gordon", Category = "Altcoin Analyst", IsVerified = true },
    };

    public static List<ExpertAccount> GetFromOptions(IOptions<CryptoExpertAccountsOptions> options)
    {
        var configured = options.Value.Accounts;
        if (configured.Count > 0)
            return options.Value.ToExpertAccounts();

        return GetDefaults();
    }
}
