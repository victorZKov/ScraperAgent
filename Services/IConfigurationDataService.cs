using ScraperAgent.Data.Entities;
using ScraperAgent.Models;

namespace ScraperAgent.Services;

public interface IConfigurationDataService
{
    // Schedule operations
    Task<List<ScheduleEntity>> GetSchedulesAsync();
    Task<ScheduleEntity?> GetScheduleByIdAsync(int id);
    Task<ScheduleEntity> AddScheduleAsync(ScheduleEntity schedule);
    Task<ScheduleEntity?> UpdateScheduleAsync(int id, ScheduleEntity updated);
    Task<bool> DeleteScheduleAsync(int id, bool permanent = false);
    Task<bool> ToggleScheduleAsync(int id, bool enabled);
    Task<List<ScheduleEntity>> GetDueSchedulesAsync(DateTime utcNow);
    Task UpdateScheduleAfterRunAsync(int id, string jobId, DateTime nextRunAt);

    // Expert operations
    Task<List<ExpertAccount>> GetExpertsAsync(string domain);
    Task<List<ExpertEntity>> GetExpertEntitiesAsync(string? domain = null);
    Task<ExpertEntity?> GetExpertByIdAsync(int id);
    Task<ExpertEntity> AddExpertAsync(ExpertEntity expert);
    Task<ExpertEntity?> UpdateExpertAsync(int id, ExpertEntity updated);
    Task<bool> DeleteExpertAsync(int id, bool permanent = false);

    // Email recipient operations
    Task<List<EmailRecipientEntity>> GetRecipientsAsync(string? domain = null);
    Task<EmailRecipientEntity> AddRecipientAsync(EmailRecipientEntity recipient);
    Task<EmailRecipientEntity?> UpdateRecipientAsync(int id, EmailRecipientEntity updated);
    Task<bool> DeleteRecipientAsync(int id, bool permanent = false);
    Task<List<string>> GetRecipientEmailsAsync(string? domain = null);

    // AI model operations
    Task<List<AIModelEntity>> GetAIModelsAsync(string? domain = null);
    Task<AIModelEntity?> GetAIModelByIdAsync(int id);
    Task<AIModelEntity?> GetDefaultAIModelAsync(string domain);
    Task<AIModelEntity> AddAIModelAsync(AIModelEntity model);
    Task<AIModelEntity?> UpdateAIModelAsync(int id, AIModelEntity updated);
    Task<bool> DeleteAIModelAsync(int id, bool permanent = false);
    Task<bool> SetDefaultAIModelAsync(int id);
}
