using System.Threading.Channels;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ScraperAgent.Configuration;
using ScraperAgent.Data;
using ScraperAgent.Endpoints;
using ScraperAgent.Models;
using ScraperAgent.Services;
using ScraperAgent.Workers;

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

// Logging
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);
builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
builder.Logging.AddFilter("System", LogLevel.Warning);
builder.Logging.AddFilter("Azure", LogLevel.Warning);

// JSON serialization: preserve PascalCase (matches TypeScript types)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = null;
});
builder.Services.Configure<Microsoft.AspNetCore.Mvc.JsonOptions>(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
});

// Configuration options
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.Configure<ExpertAccountsOptions>(builder.Configuration.GetSection(ExpertAccountsOptions.SectionName));
builder.Services.Configure<CryptoExpertAccountsOptions>(builder.Configuration.GetSection(CryptoExpertAccountsOptions.SectionName));
builder.Services.Configure<MollieOptions>(builder.Configuration.GetSection(MollieOptions.SectionName));

// HttpClient for tweet scraping (with optional proxy for residential IP)
var twitterProxy = builder.Configuration["TwitterProxy"];
builder.Services.AddHttpClient("TwitterScraper", client =>
{
    client.DefaultRequestHeaders.Add("User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    client.Timeout = TimeSpan.FromSeconds(30);
}).ConfigurePrimaryHttpMessageHandler(() =>
{
    var handler = new HttpClientHandler();
    if (!string.IsNullOrEmpty(twitterProxy))
    {
        var proxyUri = new Uri(twitterProxy);
        var webProxy = new System.Net.WebProxy(new Uri($"{proxyUri.Scheme}://{proxyUri.Host}:{proxyUri.Port}"));
        if (!string.IsNullOrEmpty(proxyUri.UserInfo))
        {
            var parts = proxyUri.UserInfo.Split(':', 2);
            webProxy.Credentials = new System.Net.NetworkCredential(parts[0], parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : "");
        }
        handler.Proxy = webProxy;
        handler.UseProxy = true;
    }
    return handler;
});

// Tweet Scraper (configurable: "mock" or "live")
var tweetSource = builder.Configuration["TweetSource"] ?? "mock";
if (tweetSource.Equals("live", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddScoped<ITweetScraperService, TweetScraperService>();
else
    builder.Services.AddScoped<ITweetScraperService, MockTweetScraperService>();

// HttpClient (general-purpose, used by SearXNG and other services)
builder.Services.AddHttpClient();

// Services
builder.Services.AddScoped<IMarketDataService, MarketDataService>();
builder.Services.AddScoped<IMarketAIService, MarketAIService>();
builder.Services.AddScoped<IReportEmailService, ReportEmailService>();
builder.Services.AddSingleton<IJobTrackingService, JobTrackingService>();
builder.Services.AddScoped<IWebSearchService, SearXNGSearchService>();
builder.Services.AddScoped<IMolliePaymentService, MolliePaymentService>();
builder.Services.AddScoped<ISubscriberService, SubscriberService>();

// In-process job queue (replaces Azure Service Bus)
builder.Services.AddSingleton(Channel.CreateUnbounded<AnalysisJobMessage>(
    new UnboundedChannelOptions { SingleReader = true }));

// Background worker for analysis pipeline
builder.Services.AddHostedService<AnalysisBackgroundService>();
builder.Services.AddHostedService<SchedulerBackgroundService>();

// PostgreSQL for configuration + reports
var connectionString = builder.Configuration.GetConnectionString("configdb");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<ScraperAgentDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// Configuration + report storage (DB-backed or fallback)
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddScoped<IConfigurationDataService, ConfigurationDataService>();
    builder.Services.AddScoped<IReportStorageService, DatabaseReportStorageService>();
}
else
{
    builder.Services.AddScoped<IConfigurationDataService, OptionsConfigurationDataService>();
    builder.Services.AddSingleton<IReportStorageService, InMemoryReportStorageService>();
}

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["QuantumID:Authority"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "name",
            RoleClaimType = "role",
            ValidateAudience = false
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Seed database on first run (non-fatal)
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetService<ScraperAgentDbContext>();
    if (dbContext != null)
    {
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseSeeder");
        await DatabaseSeeder.SeedAsync(dbContext, config, logger);
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Database seeding failed (non-fatal): {ex.Message}");
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapDefaultEndpoints();

// Map API endpoints
app.MapAnalysisEndpoints();
app.MapConfigEndpoints();
app.MapSubscriptionEndpoints();
app.MapGet("/api/version", () => Results.Ok(CommonStatics.Version));

app.Run();
