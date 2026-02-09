var builder = DistributedApplication.CreateBuilder(args);

// PostgreSQL with persistent volume + pgAdmin
var pgPassword = builder.AddParameter("pg-password");
var postgres = builder.AddPostgres("postgres", password: pgPassword)
    .WithDataVolume("scraperagent-pgdata")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin();
var configDb = postgres.AddDatabase("configdb");

// SearXNG (raw container)
var searxng = builder.AddContainer("searxng", "searxng/searxng", "latest")
    .WithBindMount("../searxng", "/etc/searxng")
    .WithHttpEndpoint(port: 8080, targetPort: 8080, name: "http")
    .WithLifetime(ContainerLifetime.Persistent);

// Web API project (replaces Azure Functions)
var apiApp = builder.AddProject<Projects.ScraperAgent>("scraper-agent")
    .WithReference(configDb)
    .WithEnvironment("SearXNG__BaseUrl", searxng.GetEndpoint("http"))
    .WithHttpEndpoint(port: 5100, name: "http")
    .WithExternalHttpEndpoints();

// Next.js UI — run separately: cd ui && pnpm run dev
// TODO: Aspire.Hosting.JavaScript 13.1.0 has a bug where the dev server
// executable is never created after pnpm install completes. Track upstream fix.
// builder.AddNodeApp("scraper-ui", "../ui", "node_modules/.bin/next")
//     .WithPnpm()
//     .WithRunScript("dev")
//     .WithHttpEndpoint(port: 3333, env: "PORT")
//     .WithEnvironment("NEXT_PUBLIC_API_URL", apiApp.GetEndpoint("http"))
//     .WithEnvironment("BROWSER", "none");

builder.Build().Run();
