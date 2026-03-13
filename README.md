# ScraperAgent

AI-powered market and crypto intelligence platform. ScraperAgent scrapes expert Twitter/X accounts, runs sentiment analysis via OpenAI, and delivers structured daily reports to subscribers by email.

## What It Does

- **Scrapes Expert Accounts** — Monitors 40+ curated Twitter/X accounts across two domains:
  - **Market** — Financial analysts and market commentators (e.g. Zero Hedge, Unusual Whales, Cathie Wood)
  - **Crypto** — On-chain researchers and crypto analysts (e.g. Whale Alert, Lookonchain, Wu Blockchain)
- **AI Analysis Pipeline** — Sends scraped tweets to Azure OpenAI / Scaleway Generative APIs for sentiment scoring, trading signal extraction, and sector classification
- **Report Generation** — Produces structured JSON reports containing overall sentiment (Bullish / Neutral / Bearish), extracted signals, sector breakdowns, and per-tweet analysis
- **Email Delivery** — Sends reports to verified subscribers on a configurable cron schedule via Scaleway SMTP
- **Subscription Management** — Free trial (5 reports over 7 days) and a paid tier (€9.99/month via Mollie payments)

## Tech Stack

| Layer | Technology |
|---|---|
| API | ASP.NET Minimal API (.NET 8) |
| Background Jobs | `Channel<T>` + `BackgroundService` |
| ORM | Entity Framework Core + Npgsql |
| AI | Azure OpenAI / Scaleway Generative APIs (GPT-4o) |
| Email | MailKit → Scaleway SMTP |
| UI | Next.js 15, React 18, TypeScript, Tailwind CSS |
| Auth | Auth.js v5 (NextAuth) + QuantumID OIDC |
| Payments | Mollie API (EUR direct debit) |
| Database | PostgreSQL (reports and config stored as JSONB) |
| Infrastructure | Kubernetes on Scaleway Kapsule |
| Local Dev | .NET Aspire (`ScraperAgent.AppHost`) or Docker Compose |

## Repository Structure

```
ScraperAgent/
├── Program.cs                  # API entry point
├── Endpoints/                  # API route handlers
│   ├── AnalysisEndpoints.cs    #   /api/{domain}/analyze, jobs, reports
│   ├── ConfigEndpoints.cs      #   /api/{domain}/config (experts, schedules, AI models)
│   └── SubscriptionEndpoints.cs#   /api/subscribe, /api/webhook/mollie
├── Services/                   # Business logic (~23 files)
│   ├── MarketAIService.cs      #   Sentiment analysis via OpenAI
│   ├── TweetScraperService.cs  #   Tweet fetching from X API
│   ├── MarketDataService.cs    #   Finnhub market data
│   ├── ReportEmailService.cs   #   Email dispatch (MailKit)
│   ├── SubscriberService.cs    #   Subscriber CRUD + Mollie sync
│   ├── MolliePaymentService.cs #   Payment processing
│   ├── JobTrackingService.cs   #   In-memory job state
│   └── ...                     #   Report storage, config, web search
├── Workers/                    # Background services
│   ├── AnalysisBackgroundService.cs  # Processes jobs from Channel<T>
│   └── SchedulerBackgroundService.cs # Cron scheduler for automated runs
├── Data/                       # EF Core DbContext, entities, migrations
├── Models/                     # Request/response DTOs
├── Configuration/              # Strongly-typed option classes
├── ui/                         # Next.js frontend
│   ├── app/(marketing)/        #   Public pages (home, pricing, subscribe, sample report)
│   ├── app/(admin)/            #   Protected admin pages (dashboard, settings, reports)
│   ├── components/             #   React components (~40 files)
│   ├── middleware.ts           #   Auth middleware
│   └── auth.ts                 #   Auth.js v5 / NextAuth config
├── ScraperAgent.AppHost/       # .NET Aspire orchestrator (local dev)
├── infra/k8s/scraperagent/     # Kubernetes manifests (API, UI, Postgres, Ingress)
├── goals/                      # Feature planning docs (ATLAS + GOTCHA workflow)
├── docker-compose.yml          # Local dev with Docker
└── Dockerfile                  # Multi-stage API build
```

## Architecture

```
┌──────────────────────────────┐
│        UI (Next.js)          │
│  Marketing pages + Admin UI  │
└─────────────┬────────────────┘
              │ HTTP
              ▼
┌──────────────────────────────┐
│    API (ASP.NET Minimal)     │
│  Analysis · Config · Subs    │
└─────────────┬────────────────┘
              │
     ┌────────┴────────┐
     ▼                  ▼
┌──────────┐   ┌──────────────┐
│ Scheduler│   │ Analysis     │
│ Worker   │──▶│ Worker       │
│ (cron)   │   │ (Channel<T>) │
└──────────┘   └──────┬───────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     ┌─────────┐ ┌────────┐ ┌────────┐
     │ X / API │ │ OpenAI │ │ SMTP   │
     │ Scraper │ │ GPT-4o │ │ Email  │
     └─────────┘ └────────┘ └────────┘
                      │
                      ▼
               ┌─────────────┐
               │ PostgreSQL   │
               │ (JSONB)      │
               └─────────────┘
```

**Analysis pipeline:** The scheduler enqueues jobs on a cron schedule. The analysis worker picks them up, scrapes tweets for the configured domain experts, sends them to OpenAI for analysis, generates a structured report, stores it in PostgreSQL, and emails it to subscribers.

## API Endpoints

All analysis and configuration endpoints require authentication. Subscription endpoints are public.

| Method | Route | Description |
|---|---|---|
| POST | `/api/{domain}/analyze` | Trigger a new analysis job |
| GET | `/api/{domain}/jobs/{jobId}` | Poll job status |
| GET | `/api/{domain}/reports` | List reports for a domain |
| GET | `/api/{domain}/reports/{reportId}` | Get a specific report |
| POST | `/api/{domain}/reports/{reportId}/resend-email` | Resend report email |
| GET | `/api/{domain}/config/experts` | List tracked expert accounts |
| POST | `/api/{domain}/config/experts` | Add an expert |
| PUT | `/api/{domain}/config/experts/{id}` | Update an expert |
| DELETE | `/api/{domain}/config/experts/{id}` | Remove an expert |
| GET | `/api/{domain}/config/schedules` | List cron schedules |
| POST | `/api/{domain}/config/schedules` | Create a schedule |
| GET | `/api/{domain}/config/ai-models` | List AI model configs |
| POST | `/api/{domain}/config/ai-models` | Add an AI model |
| POST | `/api/subscribe` | Subscribe to reports (public) |
| GET | `/api/subscribe/verify` | Verify email (public) |
| POST | `/api/webhook/mollie` | Mollie payment webhook (public) |

`{domain}` is either `market` or `crypto`.

## Getting Started

> **📖 Full setup guide:** For a comprehensive walkthrough — including how to register all external services (AI, SMTP, Mollie, QuantumID OIDC), a complete environment variable reference, database migration instructions, and Kubernetes deployment steps — see **[STARTUP.md](STARTUP.md)**.

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [PostgreSQL 14+](https://www.postgresql.org/) (or use Docker Compose)
- [Docker](https://www.docker.com/) (for local services)

### Quick Start with Docker Compose

```bash
# Clone and configure
git clone https://github.com/victorZKov/ScraperAgent.git
cd ScraperAgent
cp .env.example .env
# Edit .env with your API keys (OpenAI, Finnhub, SMTP, Mollie)

# Start all services
docker-compose up -d

# Apply database migrations
dotnet ef database update
```

The API runs at **http://localhost:7071** and the UI at **http://localhost:3000**.

### Local Development with .NET Aspire

```bash
cd ScraperAgent.AppHost
dotnet run
```

The Aspire dashboard opens automatically and orchestrates the API, UI, and database together.

### UI Development

```bash
cd ui
pnpm install
pnpm dev
```

The development server starts at **http://localhost:3000**.

## Configuration

Copy `.env.example` and fill in your credentials. Key variables:

| Variable | Description |
|---|---|
| `ConnectionStrings__configdb` | PostgreSQL connection string |
| `AzureOpenAI__Endpoint` | Azure OpenAI endpoint URL |
| `AzureOpenAI__ApiKey` | Azure OpenAI API key |
| `AzureOpenAI__DeploymentName` | Model deployment name (e.g. `gpt-4o`) |
| `Email__Smtp__Username` | Scaleway SMTP username |
| `Email__Smtp__Password` | Scaleway SMTP password |
| `Finnhub__ApiKey` | Finnhub market data API key |
| `Mollie__ApiKey` | Mollie payment API key |
| `TweetSource` | `live` for real tweets, `mock` for testing |
| `SearXNG__BaseUrl` | SearXNG metasearch URL (optional) |

Kubernetes environment variables in ConfigMaps and Secrets use the double-underscore convention to map to .NET configuration sections (e.g. `QuantumID__Authority` maps to `QuantumID:Authority`).

## Deployment

The application deploys to Kubernetes on Scaleway Kapsule. Manifests are in `infra/k8s/scraperagent/`.

```bash
# Create namespace and secrets (edit secret.yaml files to replace <PLACEHOLDER> values)
kubectl apply -f infra/k8s/scraperagent/namespace.yaml
kubectl apply -f infra/k8s/scraperagent/postgres/
kubectl apply -f infra/k8s/scraperagent/api/
kubectl apply -f infra/k8s/scraperagent/ui/
kubectl apply -f infra/k8s/scraperagent/ingress.yaml
```

Ingress routes `api.scraperagent.eu` to the API and `scraperagent.eu` to the UI.

## Database

PostgreSQL with 7 tables managed by Entity Framework Core:

| Table | Purpose |
|---|---|
| Experts | Tracked Twitter/X accounts per domain |
| Reports | Generated analysis reports (JSONB) |
| Schedules | Cron-based recurring analysis jobs |
| Subscribers | Email subscribers (free trial + paid) |
| EmailRecipients | Report recipients per domain |
| AIModels | AI provider configuration |
| AppSettings | Key-value application settings |

## Development Workflow

This project uses the **ATLAS + GOTCHA** planning workflow:

- **ATLAS** (`goals/goals_*.md`) — Human-authored design documents with problem statements, designs, and validation checklists
- **GOTCHA** (`goals/gotcha_*.md`) — AI execution instructions with exact file paths, code snippets, and acceptance criteria
- **Manifest** (`goals/manifest.md`) — Index of all features and their status

Check the manifest before starting any new feature work.

## License

This is a private project. All rights reserved.
