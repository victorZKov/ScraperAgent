using Cronos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ScraperAgent.Data;
using ScraperAgent.Data.Entities;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

public class ConfigurationDataService : IConfigurationDataService
{
    private readonly ScraperAgentDbContext _db;
    private readonly ILogger<ConfigurationDataService> _logger;

    public ConfigurationDataService(ScraperAgentDbContext db, ILogger<ConfigurationDataService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Expert operations ──────────────────────────────────────────────

    public async Task<List<ExpertAccount>> GetExpertsAsync(string domain)
    {
        var entities = await _db.Experts
            .Where(e => e.Domain == domain && e.IsActive)
            .ToListAsync();

        return entities.Select(e => new ExpertAccount
        {
            Handle = e.Handle,
            DisplayName = e.DisplayName,
            Category = e.Category,
            IsVerified = e.IsVerified,
            Weight = e.Weight,
            Bias = e.Bias,
            IsContrarian = e.IsContrarian
        }).ToList();
    }

    public async Task<List<ExpertEntity>> GetExpertEntitiesAsync(string? domain = null)
    {
        var query = _db.Experts.AsQueryable();

        if (!string.IsNullOrEmpty(domain))
            query = query.Where(e => e.Domain == domain);

        return await query.OrderBy(e => e.Handle).ToListAsync();
    }

    public async Task<ExpertEntity?> GetExpertByIdAsync(int id)
    {
        return await _db.Experts.FindAsync(id);
    }

    public async Task<ExpertEntity> AddExpertAsync(ExpertEntity expert)
    {
        expert.CreatedAt = DateTime.UtcNow;
        expert.UpdatedAt = DateTime.UtcNow;

        _db.Experts.Add(expert);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Added expert {Handle} (domain: {Domain}, id: {Id})",
            expert.Handle, expert.Domain, expert.Id);

        return expert;
    }

    public async Task<ExpertEntity?> UpdateExpertAsync(int id, ExpertEntity updated)
    {
        var existing = await _db.Experts.FindAsync(id);
        if (existing == null)
            return null;

        existing.Handle = updated.Handle;
        existing.DisplayName = updated.DisplayName;
        existing.Category = updated.Category;
        existing.IsVerified = updated.IsVerified;
        existing.Weight = updated.Weight;
        existing.Bias = updated.Bias;
        existing.IsContrarian = updated.IsContrarian;
        existing.IsActive = updated.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated expert {Id} ({Handle})", id, existing.Handle);

        return existing;
    }

    public async Task<bool> DeleteExpertAsync(int id, bool permanent = false)
    {
        var existing = await _db.Experts.FindAsync(id);
        if (existing == null)
            return false;

        if (permanent)
        {
            _db.Experts.Remove(existing);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Hard-deleted expert {Id} ({Handle})", id, existing.Handle);
        }
        else
        {
            existing.IsActive = false;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Soft-deleted expert {Id} ({Handle})", id, existing.Handle);
        }

        return true;
    }

    // ── Email recipient operations ─────────────────────────────────────

    public async Task<List<EmailRecipientEntity>> GetRecipientsAsync(string? domain = null)
    {
        var query = _db.EmailRecipients
            .Where(r => r.IsActive);

        if (!string.IsNullOrEmpty(domain))
            query = query.Where(r => r.Domain == domain || r.Domain == "all");

        return await query.OrderBy(r => r.Email).ToListAsync();
    }

    public async Task<EmailRecipientEntity> AddRecipientAsync(EmailRecipientEntity recipient)
    {
        var existing = await _db.EmailRecipients
            .FirstOrDefaultAsync(r => r.Email == recipient.Email && r.Domain == recipient.Domain);

        if (existing != null)
        {
            if (existing.IsActive)
                throw new InvalidOperationException($"Recipient '{recipient.Email}' already exists for domain '{recipient.Domain}'.");

            // Reactivate soft-deleted recipient
            existing.IsActive = true;
            existing.CreatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogInformation("Reactivated email recipient {Email} (domain: {Domain}, id: {Id})",
                existing.Email, existing.Domain, existing.Id);
            return existing;
        }

        recipient.CreatedAt = DateTime.UtcNow;
        _db.EmailRecipients.Add(recipient);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Added email recipient {Email} (domain: {Domain}, id: {Id})",
            recipient.Email, recipient.Domain, recipient.Id);

        return recipient;
    }

    public async Task<EmailRecipientEntity?> UpdateRecipientAsync(int id, EmailRecipientEntity updated)
    {
        var existing = await _db.EmailRecipients.FindAsync(id);
        if (existing == null)
            return null;

        existing.Domain = updated.Domain;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated email recipient {Id} ({Email}) domain to {Domain}",
            id, existing.Email, existing.Domain);

        return existing;
    }

    public async Task<bool> DeleteRecipientAsync(int id, bool permanent = false)
    {
        var existing = await _db.EmailRecipients.FindAsync(id);
        if (existing == null)
            return false;

        if (permanent)
        {
            _db.EmailRecipients.Remove(existing);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Hard-deleted email recipient {Id} ({Email})", id, existing.Email);
        }
        else
        {
            existing.IsActive = false;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Soft-deleted email recipient {Id} ({Email})", id, existing.Email);
        }

        return true;
    }

    public async Task<List<string>> GetRecipientEmailsAsync(string? domain = null)
    {
        var query = _db.EmailRecipients
            .Where(r => r.IsActive && r.Domain != "none");

        if (!string.IsNullOrEmpty(domain))
            query = query.Where(r => r.Domain == domain || r.Domain == "all");

        return await query.Select(r => r.Email).ToListAsync();
    }

    // ── AI model operations ─────────────────────────────────────────────

    public async Task<List<AIModelEntity>> GetAIModelsAsync(string? domain = null)
    {
        var query = _db.AIModels
            .Where(m => m.IsActive);

        if (!string.IsNullOrEmpty(domain))
            query = query.Where(m => m.Domain == domain || m.Domain == "all");

        return await query.OrderBy(m => m.Name).ToListAsync();
    }

    public async Task<AIModelEntity?> GetAIModelByIdAsync(int id)
    {
        return await _db.AIModels.FindAsync(id);
    }

    public async Task<AIModelEntity?> GetDefaultAIModelAsync(string domain)
    {
        // First try exact domain match
        var model = await _db.AIModels
            .Where(m => m.IsActive && m.IsDefault && m.Domain == domain)
            .FirstOrDefaultAsync();

        if (model != null)
            return model;

        // Fallback to "all" domain
        return await _db.AIModels
            .Where(m => m.IsActive && m.IsDefault && m.Domain == "all")
            .FirstOrDefaultAsync();
    }

    public async Task<AIModelEntity> AddAIModelAsync(AIModelEntity model)
    {
        model.CreatedAt = DateTime.UtcNow;
        model.UpdatedAt = DateTime.UtcNow;

        _db.AIModels.Add(model);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Added AI model {Name} (domain: {Domain}, id: {Id})",
            model.Name, model.Domain, model.Id);

        return model;
    }

    public async Task<AIModelEntity?> UpdateAIModelAsync(int id, AIModelEntity updated)
    {
        var existing = await _db.AIModels.FindAsync(id);
        if (existing == null)
            return null;

        existing.Name = updated.Name;
        existing.Provider = updated.Provider;
        existing.Endpoint = updated.Endpoint;
        existing.ApiKey = updated.ApiKey;
        existing.DeploymentName = updated.DeploymentName;
        existing.IsDefault = updated.IsDefault;
        existing.Domain = updated.Domain;
        existing.IsActive = updated.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated AI model {Id} ({Name})", id, existing.Name);

        return existing;
    }

    public async Task<bool> DeleteAIModelAsync(int id, bool permanent = false)
    {
        var existing = await _db.AIModels.FindAsync(id);
        if (existing == null)
            return false;

        if (permanent)
        {
            _db.AIModels.Remove(existing);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Hard-deleted AI model {Id} ({Name})", id, existing.Name);
        }
        else
        {
            existing.IsActive = false;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Soft-deleted AI model {Id} ({Name})", id, existing.Name);
        }

        return true;
    }

    public async Task<bool> SetDefaultAIModelAsync(int id)
    {
        var target = await _db.AIModels.FindAsync(id);
        if (target == null || !target.IsActive)
            return false;

        await using var transaction = await _db.Database.BeginTransactionAsync();

        // Unset IsDefault on all models with the same domain
        var sameDomainModels = await _db.AIModels
            .Where(m => m.Domain == target.Domain && m.IsDefault)
            .ToListAsync();

        foreach (var m in sameDomainModels)
        {
            m.IsDefault = false;
            m.UpdatedAt = DateTime.UtcNow;
        }

        // Set target as default
        target.IsDefault = true;
        target.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        _logger.LogInformation("Set AI model {Id} ({Name}) as default for domain {Domain}",
            id, target.Name, target.Domain);

        return true;
    }

    // ── Schedule operations ──────────────────────────────────────────────

    public async Task<List<ScheduleEntity>> GetSchedulesAsync()
    {
        return await _db.Schedules
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    public async Task<ScheduleEntity?> GetScheduleByIdAsync(int id)
    {
        return await _db.Schedules.FindAsync(id);
    }

    public async Task<ScheduleEntity> AddScheduleAsync(ScheduleEntity schedule)
    {
        var cron = CronExpression.Parse(schedule.CronExpression);
        var tz = TimeZoneInfo.FindSystemTimeZoneById(schedule.Timezone);
        schedule.NextRunAt = cron.GetNextOccurrence(DateTime.UtcNow, tz);
        schedule.CreatedAt = DateTime.UtcNow;
        schedule.UpdatedAt = DateTime.UtcNow;

        _db.Schedules.Add(schedule);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Added schedule '{Name}' (cron: {Cron}, domain: {Domain}, id: {Id})",
            schedule.Name, schedule.CronExpression, schedule.Domain, schedule.Id);

        return schedule;
    }

    public async Task<ScheduleEntity?> UpdateScheduleAsync(int id, ScheduleEntity updated)
    {
        var existing = await _db.Schedules.FindAsync(id);
        if (existing == null) return null;

        existing.Name = updated.Name;
        existing.CronExpression = updated.CronExpression;
        existing.Domain = updated.Domain;
        existing.Timezone = updated.Timezone;
        existing.IsEnabled = updated.IsEnabled;
        existing.UpdatedAt = DateTime.UtcNow;

        // Recompute NextRunAt
        var cron = CronExpression.Parse(existing.CronExpression);
        var tz = TimeZoneInfo.FindSystemTimeZoneById(existing.Timezone);
        existing.NextRunAt = cron.GetNextOccurrence(DateTime.UtcNow, tz);

        await _db.SaveChangesAsync();
        _logger.LogInformation("Updated schedule {Id} ('{Name}')", id, existing.Name);

        return existing;
    }

    public async Task<bool> DeleteScheduleAsync(int id, bool permanent = false)
    {
        var existing = await _db.Schedules.FindAsync(id);
        if (existing == null) return false;

        if (permanent)
        {
            _db.Schedules.Remove(existing);
            _logger.LogInformation("Hard-deleted schedule {Id} ('{Name}')", id, existing.Name);
        }
        else
        {
            existing.IsActive = false;
            existing.IsEnabled = false;
            existing.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("Soft-deleted schedule {Id} ('{Name}')", id, existing.Name);
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleScheduleAsync(int id, bool enabled)
    {
        var existing = await _db.Schedules.FindAsync(id);
        if (existing == null || !existing.IsActive) return false;

        existing.IsEnabled = enabled;
        existing.UpdatedAt = DateTime.UtcNow;

        if (enabled)
        {
            var cron = CronExpression.Parse(existing.CronExpression);
            var tz = TimeZoneInfo.FindSystemTimeZoneById(existing.Timezone);
            existing.NextRunAt = cron.GetNextOccurrence(DateTime.UtcNow, tz);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("{Action} schedule {Id} ('{Name}')",
            enabled ? "Enabled" : "Disabled", id, existing.Name);

        return true;
    }

    public async Task<List<ScheduleEntity>> GetDueSchedulesAsync(DateTime utcNow)
    {
        return await _db.Schedules
            .Where(s => s.IsActive && s.IsEnabled && s.NextRunAt != null && s.NextRunAt <= utcNow)
            .ToListAsync();
    }

    public async Task UpdateScheduleAfterRunAsync(int id, string jobId, DateTime nextRunAt)
    {
        var schedule = await _db.Schedules.FindAsync(id);
        if (schedule == null) return;

        schedule.LastRunAt = DateTime.UtcNow;
        schedule.LastRunJobId = jobId;
        schedule.LastRunStatus = "Queued";
        schedule.NextRunAt = nextRunAt;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }
}
