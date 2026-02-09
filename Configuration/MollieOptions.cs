namespace ScraperAgent.Configuration;

public class MollieOptions
{
    public const string SectionName = "Mollie";

    public string ApiKey { get; set; } = string.Empty;
    public string WebhookBaseUrl { get; set; } = string.Empty;
    public string RedirectBaseUrl { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; } = 9.99m;
    public string Currency { get; set; } = "USD";
}
