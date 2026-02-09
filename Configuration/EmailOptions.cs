namespace ScraperAgent.Configuration;

public class EmailOptions
{
    public const string SectionName = "Email";

    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public SmtpOptions Smtp { get; set; } = new();
}

public class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
}
