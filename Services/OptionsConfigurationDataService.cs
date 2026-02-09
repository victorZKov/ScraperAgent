using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ScraperAgent.Configuration;
using ScraperAgent.Data.Entities;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

/// <summary>
/// Fallback IConfigurationDataService that reads from IOptions / IConfiguration
/// when PostgreSQL is not available. Mutation operations are not supported.
/// </summary>
public class OptionsConfigurationDataService : IConfigurationDataService
{
    private readonly IOptions<ExpertAccountsOptions> _marketExpertOptions;
    private readonly IOptions<CryptoExpertAccountsOptions> _cryptoExpertOptions;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OptionsConfigurationDataService> _logger;

    public OptionsConfigurationDataService(
        IOptions<ExpertAccountsOptions> marketExpertOptions,
        IOptions<CryptoExpertAccountsOptions> cryptoExpertOptions,
        IConfiguration configuration,
        ILogger<OptionsConfigurationDataService> logger)
    {
        _marketExpertOptions = marketExpertOptions;
        _cryptoExpertOptions = cryptoExpertOptions;
        _configuration = configuration;
        _logger = logger;
    }

    // ── Expert operations ──────────────────────────────────────────────

    public Task<List<ExpertAccount>> GetExpertsAsync(string domain)
    {
        var experts = domain == "crypto"
            ? DefaultCryptoExpertAccounts.GetFromOptions(_cryptoExpertOptions)
            : DefaultExpertAccounts.GetFromOptions(_marketExpertOptions);

        _logger.LogInformation("Loaded {Count} experts for domain '{Domain}' from options/defaults",
            experts.Count, domain);

        return Task.FromResult(experts);
    }

    public Task<List<ExpertEntity>> GetExpertEntitiesAsync(string? domain = null)
    {
        var entities = new List<ExpertEntity>();
        var id = 1;

        if (domain is null or "market")
        {
            var marketExperts = DefaultExpertAccounts.GetFromOptions(_marketExpertOptions);
            foreach (var expert in marketExperts)
            {
                entities.Add(new ExpertEntity
                {
                    Id = id++,
                    Handle = expert.Handle,
                    DisplayName = expert.DisplayName,
                    Category = expert.Category,
                    IsVerified = expert.IsVerified,
                    Domain = "market",
                    IsActive = true
                });
            }
        }

        if (domain is null or "crypto")
        {
            var cryptoExperts = DefaultCryptoExpertAccounts.GetFromOptions(_cryptoExpertOptions);
            foreach (var expert in cryptoExperts)
            {
                entities.Add(new ExpertEntity
                {
                    Id = id++,
                    Handle = expert.Handle,
                    DisplayName = expert.DisplayName,
                    Category = expert.Category,
                    IsVerified = expert.IsVerified,
                    Domain = "crypto",
                    IsActive = true
                });
            }
        }

        return Task.FromResult(entities);
    }

    public Task<ExpertEntity?> GetExpertByIdAsync(int id)
    {
        // In the options-based fallback, we generate fake IDs so look up by iterating
        var allEntities = GetExpertEntitiesAsync().GetAwaiter().GetResult();
        var entity = allEntities.FirstOrDefault(e => e.Id == id);
        return Task.FromResult(entity);
    }

    public Task<ExpertEntity> AddExpertAsync(ExpertEntity expert)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<ExpertEntity?> UpdateExpertAsync(int id, ExpertEntity updated)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<bool> DeleteExpertAsync(int id, bool permanent = false)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    // ── Email recipient operations ─────────────────────────────────────

    public Task<List<EmailRecipientEntity>> GetRecipientsAsync(string? domain = null)
    {
        var emails = GetRecipientEmailsFromConfig();
        var id = 1;

        var entities = emails.Select(email => new EmailRecipientEntity
        {
            Id = id++,
            Email = email,
            Domain = "all",
            IsActive = true
        }).ToList();

        return Task.FromResult(entities);
    }

    public Task<EmailRecipientEntity> AddRecipientAsync(EmailRecipientEntity recipient)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<EmailRecipientEntity?> UpdateRecipientAsync(int id, EmailRecipientEntity updated)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<bool> DeleteRecipientAsync(int id, bool permanent = false)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<List<string>> GetRecipientEmailsAsync(string? domain = null)
    {
        var emails = GetRecipientEmailsFromConfig();
        return Task.FromResult(emails);
    }

    // ── AI model operations ────────────────────────────────────────────

    public Task<List<AIModelEntity>> GetAIModelsAsync(string? domain = null)
    {
        return Task.FromResult(new List<AIModelEntity>());
    }

    public Task<AIModelEntity?> GetAIModelByIdAsync(int id)
    {
        return Task.FromResult<AIModelEntity?>(null);
    }

    public Task<AIModelEntity?> GetDefaultAIModelAsync(string domain)
    {
        return Task.FromResult<AIModelEntity?>(null);
    }

    public Task<AIModelEntity> AddAIModelAsync(AIModelEntity model)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<AIModelEntity?> UpdateAIModelAsync(int id, AIModelEntity updated)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<bool> DeleteAIModelAsync(int id, bool permanent = false)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    public Task<bool> SetDefaultAIModelAsync(int id)
    {
        throw new NotSupportedException(
            "PostgreSQL is not configured. Configuration changes require a database connection.");
    }

    // ── Schedule operations ──────────────────────────────────────────────

    public Task<List<ScheduleEntity>> GetSchedulesAsync()
        => Task.FromResult(new List<ScheduleEntity>());

    public Task<ScheduleEntity?> GetScheduleByIdAsync(int id)
        => Task.FromResult<ScheduleEntity?>(null);

    public Task<ScheduleEntity> AddScheduleAsync(ScheduleEntity schedule)
        => throw new NotSupportedException("PostgreSQL is not configured. Configuration changes require a database connection.");

    public Task<ScheduleEntity?> UpdateScheduleAsync(int id, ScheduleEntity updated)
        => throw new NotSupportedException("PostgreSQL is not configured. Configuration changes require a database connection.");

    public Task<bool> DeleteScheduleAsync(int id, bool permanent = false)
        => throw new NotSupportedException("PostgreSQL is not configured. Configuration changes require a database connection.");

    public Task<bool> ToggleScheduleAsync(int id, bool enabled)
        => throw new NotSupportedException("PostgreSQL is not configured. Configuration changes require a database connection.");

    public Task<List<ScheduleEntity>> GetDueSchedulesAsync(DateTime utcNow)
        => Task.FromResult(new List<ScheduleEntity>());

    public Task UpdateScheduleAfterRunAsync(int id, string jobId, DateTime nextRunAt)
        => Task.CompletedTask;

    // ── Private helpers ────────────────────────────────────────────────

    private List<string> GetRecipientEmailsFromConfig()
    {
        var recipientsConfig = _configuration["ReportRecipients"]
                               ?? Environment.GetEnvironmentVariable("ReportRecipients")
                               ?? "";

        return recipientsConfig
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(r => r.Trim())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .ToList();
    }
}
