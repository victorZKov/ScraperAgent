using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ScraperAgent.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ScraperAgentDbContext>
{
    public ScraperAgentDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ScraperAgentDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=configdb;Username=postgres;Password=postgres");

        return new ScraperAgentDbContext(optionsBuilder.Options);
    }
}
