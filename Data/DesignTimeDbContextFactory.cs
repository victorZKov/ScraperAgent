using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ScraperAgent.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ScraperAgentDbContext>
{
    public ScraperAgentDbContext CreateDbContext(string[] args)
    {
        // Read connection string from environment variable (set via K8s secret or local .env).
        // The fallback is intentionally insecure default credentials for local development only.
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__configdb")
            ?? "Host=localhost;Database=configdb;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<ScraperAgentDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new ScraperAgentDbContext(optionsBuilder.Options);
    }
}
