namespace ScraperAgent.Data.Entities;

public class ExpertEntity
{
    public int Id { get; set; }
    public string Handle { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = true;
    public string Domain { get; set; } = "market"; // "market" or "crypto"
    public int Weight { get; set; } = 5;
    public string Bias { get; set; } = string.Empty;
    public bool IsContrarian { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
