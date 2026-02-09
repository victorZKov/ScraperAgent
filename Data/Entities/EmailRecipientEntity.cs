namespace ScraperAgent.Data.Entities;

public class EmailRecipientEntity
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Domain { get; set; } = "all"; // "market", "crypto", or "all"
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
