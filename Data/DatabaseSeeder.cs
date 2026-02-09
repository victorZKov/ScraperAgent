using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ScraperAgent.Configuration;
using ScraperAgent.Data.Entities;

namespace ScraperAgent.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ScraperAgentDbContext dbContext, IConfiguration configuration, ILogger? logger = null)
    {
        // Retry up to 10 times with exponential backoff (PostgreSQL may not be ready yet)
        var maxRetries = 10;
        for (var attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                await dbContext.Database.MigrateAsync();
                break;
            }
            catch (Exception ex) when (attempt < maxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt - 1));
                logger?.LogWarning("Database not ready (attempt {Attempt}/{Max}): {Error}. Retrying in {Delay}s...",
                    attempt, maxRetries, ex.Message, delay.TotalSeconds);
                await Task.Delay(delay);
            }
        }

        // Seed experts if the table is empty
        if (!await dbContext.Experts.AnyAsync())
        {
            var marketExperts = DefaultExpertAccounts.GetDefaults()
                .Select(e => new ExpertEntity
                {
                    Handle = e.Handle,
                    DisplayName = e.DisplayName,
                    Category = e.Category,
                    IsVerified = e.IsVerified,
                    Domain = "market",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            var cryptoExperts = DefaultCryptoExpertAccounts.GetDefaults()
                .Select(e => new ExpertEntity
                {
                    Handle = e.Handle,
                    DisplayName = e.DisplayName,
                    Category = e.Category,
                    IsVerified = e.IsVerified,
                    Domain = "crypto",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            dbContext.Experts.AddRange(marketExperts);
            dbContext.Experts.AddRange(cryptoExperts);
            await dbContext.SaveChangesAsync();

            logger?.LogInformation("Seeded {Count} market + crypto experts",
                DefaultExpertAccounts.GetDefaults().Count + DefaultCryptoExpertAccounts.GetDefaults().Count);
        }

        // Seed additional experts that may not exist yet
        await SeedAdditionalExpertsAsync(dbContext, logger);

        // Seed email recipients if the table is empty
        if (!await dbContext.EmailRecipients.AnyAsync())
        {
            var recipients = configuration.GetSection("ReportRecipients").Get<string[]>();
            if (recipients != null && recipients.Length > 0)
            {
                var recipientEntities = recipients.Select(email => new EmailRecipientEntity
                {
                    Email = email,
                    Domain = "all",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });

                dbContext.EmailRecipients.AddRange(recipientEntities);
                await dbContext.SaveChangesAsync();

                logger?.LogInformation("Seeded {Count} email recipients", recipients.Length);
            }
        }

        // Seed default AI model if table is empty
        if (!await dbContext.AIModels.AnyAsync())
        {
            var endpoint = configuration["AzureOpenAI:Endpoint"]
                           ?? configuration["AzureOpenAI__Endpoint"]
                           ?? "";
            var apiKey = configuration["AzureOpenAI:ApiKey"]
                         ?? configuration["AzureOpenAI__ApiKey"]
                         ?? "";
            var deployment = configuration["AzureOpenAI:DeploymentName"]
                             ?? configuration["AzureOpenAI__DeploymentName"]
                             ?? "gpt-4o";

            if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(apiKey))
            {
                dbContext.AIModels.Add(new AIModelEntity
                {
                    Name = deployment,
                    Provider = "azure-openai",
                    Endpoint = endpoint,
                    ApiKey = apiKey,
                    DeploymentName = deployment,
                    IsDefault = false,
                    Domain = "all",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                logger?.LogInformation("Seeded AI model: {Deployment} (azure-openai)", deployment);
            }

            // Seed Scaleway GPT-OSS 120B (default model)
            var scwApiKey = configuration["ScalewayAI:ApiKey"]
                            ?? configuration["ScalewayAI__ApiKey"]
                            ?? "";
            if (!string.IsNullOrEmpty(scwApiKey))
            {
                dbContext.AIModels.Add(new AIModelEntity
                {
                    Name = "GPT-OSS 120B",
                    Provider = "scaleway",
                    Endpoint = "https://api.scaleway.ai/v1/",
                    ApiKey = scwApiKey,
                    DeploymentName = "gpt-oss-120b",
                    IsDefault = true,
                    Domain = "all",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                logger?.LogInformation("Seeded AI model: GPT-OSS 120B (scaleway, default)");
            }

            await dbContext.SaveChangesAsync();
        }

        // Seed default schedules if table is empty
        if (!await dbContext.Schedules.AnyAsync())
        {
            dbContext.Schedules.AddRange(
                new ScheduleEntity
                {
                    Name = "Daily Market Analysis (8:00 AM)",
                    CronExpression = "0 8 * * *",
                    Domain = "market",
                    Timezone = "Europe/Madrid",
                    IsEnabled = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new ScheduleEntity
                {
                    Name = "Daily Crypto Analysis (9:00 AM)",
                    CronExpression = "0 9 * * *",
                    Domain = "crypto",
                    Timezone = "Europe/Madrid",
                    IsEnabled = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
            await dbContext.SaveChangesAsync();
            logger?.LogInformation("Seeded 2 default schedules (disabled)");
        }
    }

    private static async Task SeedAdditionalExpertsAsync(ScraperAgentDbContext dbContext, ILogger? logger)
    {
        var additionalExperts = new List<(string Handle, string DisplayName, string Category, string Domain, int Weight, bool IsContrarian)>
        {
            // Additional market experts - financial news
            ("SquawkCNBC", "Squawk Box CNBC", "financial_news", "market", 5, false),
            ("MarketCurrents", "Market Currents", "financial_news", "market", 5, false),
            ("StockMKTNewz", "Stock Market News", "financial_news", "market", 5, false),

            // Market analysts
            ("LizAnnSonders", "Liz Ann Sonders", "market_analyst", "market", 5, false),
            ("CyclesFan", "CyclesFan", "market_analyst", "market", 5, false),
            ("yuriymatso", "Yuriy Matso", "market_analyst", "market", 7, false),
            ("HenrikZeberg", "Henrik Zeberg", "market_analyst", "market", 6, false),
            ("DaveHcontrarian", "Dave H Contrarian", "market_analyst", "market", 5, false),

            // Traders & swing traders
            ("AdamMancini4", "Adam Mancini", "trader", "market", 7, false),
            ("Basssem666", "Basssem", "trader", "market", 5, true),
            ("CastilloTrading", "Castillo Trading", "trader", "market", 4, false),
            ("ChartMasterSara", "ChartMasterSara", "trader", "market", 5, false),
            ("GregaHorvatFX", "Grega Horvat", "trader", "market", 5, false),
            ("IncomeSharks", "IncomeSharks", "trader", "market", 9, false),
            ("JohnLoc18", "JohnLoc", "trader", "market", 5, false),
            ("KGBULLANDBEAR", "KG Bull and Bear", "trader", "market", 5, false),
            ("markminervini", "Mark Minervini", "trader", "market", 7, false),
            ("PKDayTrading1", "PK Day Trading", "trader", "market", 7, false),
            ("ShortSeller", "ShortSeller", "trader", "market", 5, true),
            ("SuperLuckeee", "SuperLuckeee", "trader", "market", 7, false),
            ("SwingTraderQ", "SwingTraderQ", "trader", "market", 5, false),
            ("Team2Trading", "Team2Trading", "trader", "market", 5, false),
            ("The_RockTrading", "The Rock Trading", "trader", "market", 8, false),
            ("therealmorph835", "Morph", "trader", "market", 8, false),
            ("TradingWarz", "TradingWarz", "trader", "market", 5, false),
            ("TriggerTrades", "Trigger Trades", "trader", "market", 7, true),
            ("vandy_trades", "Vandy Trades", "trader", "market", 8, false),

            // Options trader
            ("EliteOptions2", "Elite Options", "options_trader", "market", 9, false),

            // Crypto traders
            ("crypto_caesar1", "Crypto Caesar", "crypto_trader", "crypto", 5, false),
            ("EmperorBTC", "EmperorBTC", "crypto_trader", "crypto", 5, false),

            // Additional crypto experts
            ("zachxbt", "ZachXBT", "crypto_analyst", "crypto", 5, false),
            ("SatoshiClub", "Satoshi Club", "crypto_community", "crypto", 5, false),
            ("CryptoCapo_", "Capo of Crypto", "crypto_analyst", "crypto", 5, false),
            ("The_Cryptonomist", "The Cryptonomist", "crypto_news", "crypto", 5, false),
            ("caborneio", "Carl Borneio", "crypto_analyst", "crypto", 5, false),
            ("crypto_birb", "Crypto Birb", "crypto_analyst", "crypto", 5, false),
            ("EmberCN", "EmberCN", "crypto_analyst", "crypto", 5, false),
            ("CryptoHayes", "Arthur Hayes", "crypto_analyst", "crypto", 5, false),
        };

        var addedCount = 0;
        foreach (var (handle, displayName, category, domain, weight, isContrarian) in additionalExperts)
        {
            var exists = await dbContext.Experts
                .AnyAsync(e => e.Handle == handle && e.Domain == domain);

            if (!exists)
            {
                dbContext.Experts.Add(new ExpertEntity
                {
                    Handle = handle,
                    DisplayName = displayName,
                    Category = category,
                    IsVerified = true,
                    Domain = domain,
                    Weight = weight,
                    IsContrarian = isContrarian,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                addedCount++;
            }
        }

        if (addedCount > 0)
        {
            await dbContext.SaveChangesAsync();
            logger?.LogInformation("Seeded {Count} additional experts", addedCount);
        }
    }
}
