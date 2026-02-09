namespace ScraperAgent.Data.Entities;

public class AIModelEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;       // Display name, e.g. "GPT-4o"
    public string Provider { get; set; } = "azure-openai";  // "azure-openai" or "azure-foundry"
    public string Endpoint { get; set; } = string.Empty;    // Full endpoint URL
    public string ApiKey { get; set; } = string.Empty;      // API key
    public string DeploymentName { get; set; } = string.Empty; // Model deployment name
    public bool IsDefault { get; set; } = false;
    public string Domain { get; set; } = "all";             // "market", "crypto", or "all"
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
