# ScraperAgent — Startup & Configuration Guide

This document explains how to set up ScraperAgent from scratch: registering external services, configuring environment variables, running locally, applying database migrations, and deploying to Kubernetes.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [External Services — Obtain API Keys](#2-external-services--obtain-api-keys)
   - [Azure OpenAI or Scaleway Generative AI](#21-azure-openai-or-scaleway-generative-ai)
   - [Finnhub (Market Data)](#22-finnhub-market-data)
   - [Scaleway SMTP (Transactional Email)](#23-scaleway-smtp-transactional-email)
   - [Mollie (Payments)](#24-mollie-payments)
   - [Twitter / X API](#25-twitter--x-api)
   - [QuantumID OIDC (Authentication)](#26-quantumid-oidc-authentication)
3. [Environment Variables Reference](#3-environment-variables-reference)
   - [API](#31-api-environment-variables)
   - [UI](#32-ui-environment-variables)
4. [Local Development](#4-local-development)
   - [Option A — .NET Aspire (recommended)](#option-a--net-aspire-recommended)
   - [Option B — Docker Compose (home / Windows)](#option-b--docker-compose-home--windows)
   - [Option C — UI only](#option-c--ui-only)
5. [Database Migrations](#5-database-migrations)
6. [Kubernetes Deployment](#6-kubernetes-deployment)
7. [Verification Checklist](#7-verification-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Install the following tools before continuing:

| Tool | Version | Notes |
|---|---|---|
| [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) | 8.0+ | Required for API and Aspire |
| [Node.js](https://nodejs.org/) | 18+ | Required for UI |
| [pnpm](https://pnpm.io/) | Latest | UI package manager — `npm install -g pnpm` |
| [Docker](https://www.docker.com/) | 24+ | Local services (PostgreSQL, SearXNG) |
| [PostgreSQL client](https://www.postgresql.org/download/) | 14+ | Optional; only needed to connect directly to the DB |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | Latest | Required for Kubernetes deployment |

---

## 2. External Services — Obtain API Keys

You need accounts and credentials for each service below before the application can run end-to-end. All keys must be placed in the environment configuration described in [Section 3](#3-environment-variables-reference).

### 2.1 Azure OpenAI or Scaleway Generative AI

ScraperAgent uses GPT-4o (or an equivalent model) for tweet sentiment analysis. You need **at least one** AI provider.

**Azure OpenAI**
1. Create an [Azure OpenAI resource](https://portal.azure.com/) in the Azure portal.
2. Deploy a model (e.g. `gpt-4o`) and note the **Endpoint**, **API Key**, and **Deployment Name**.

**Scaleway Generative APIs** (alternative or complement)
1. Sign in to the [Scaleway console](https://console.scaleway.com/).
2. Navigate to **AI & ML → Generative APIs**.
3. Create an API key from **IAM → API Keys** and note it.

### 2.2 Finnhub (Market Data)

Finnhub provides real-time market data used during analysis.

1. Register a free account at [finnhub.io](https://finnhub.io/).
2. Copy your **API Key** from the dashboard.

### 2.3 Scaleway SMTP (Transactional Email)

ScraperAgent sends reports and verification emails via Scaleway Transactional Email.

1. In the Scaleway console, navigate to **Managed Services → Transactional Email**.
2. Add and verify a sender domain (e.g. `scraperagent.eu`).
3. Create SMTP credentials and note the **Username** and **Password**.
4. The SMTP host is `smtp.tem.scaleway.com` on port `587` with STARTTLS.

### 2.4 Mollie (Payments)

Mollie processes monthly subscription payments.

1. Register at [mollie.com](https://www.mollie.com/).
2. Under **Developers → API Keys**, copy the **Live API Key** (prefix `live_`) for production or a **Test API Key** (prefix `test_`) for development.
3. Set the webhook URL to `https://api.scraperagent.eu/api/webhook/mollie` in the Mollie dashboard.

### 2.5 Twitter / X API

Tweet scraping requires a residential proxy (datacenter IPs are blocked by X). No official X API key is required for scraping, but a proxy is needed.

- Set `TweetSource=live` to fetch real tweets (requires a working proxy in `TwitterProxy`).
- Set `TweetSource=mock` to use synthetic data for local development without a proxy.

### 2.6 QuantumID OIDC (Authentication)

The UI admin section is protected via [QuantumID](https://auth.quantumapi.eu) OIDC. For full setup instructions, including creating the app registration and generating the `NEXTAUTH_SECRET`, see [`goals/setup_quantumid_app.md`](goals/setup_quantumid_app.md).

**Quick summary:**

```bash
# Install qapi CLI
brew install quantumapi-eu/tap/qapi   # macOS
# or: curl -sSL https://docs.quantumapi.eu/cli/install.sh | sh

qapi login

# Register the UI application
qapi apps create "ScraperAgent UI" \
  --type WebApp \
  --redirect-uri "https://scraperagent.eu/api/auth/callback/quantumid" \
  --redirect-uri "http://localhost:3000/api/auth/callback/quantumid" \
  --scopes "openid,profile,email,api,tenant,offline_access"
# Save the CLIENT_ID and CLIENT_SECRET from the output

# Generate NEXTAUTH_SECRET
qapi random 32 --encoding base64
```

---

## 3. Environment Variables Reference

### 3.1 API Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `ConnectionStrings__configdb` | ✅ | PostgreSQL connection string |
| `AzureOpenAI__Endpoint` | ✅* | Azure OpenAI endpoint URL |
| `AzureOpenAI__ApiKey` | ✅* | Azure OpenAI API key |
| `AzureOpenAI__DeploymentName` | ✅* | Model deployment name (e.g. `gpt-4o`) |
| `ScalewayAI__ApiKey` | ✅* | Scaleway Generative API key |
| `Email__FromEmail` | ✅ | Sender email address (e.g. `noreply@scraperagent.eu`) |
| `Email__FromName` | ✅ | Sender display name |
| `Email__Smtp__Host` | ✅ | SMTP host (e.g. `smtp.tem.scaleway.com`) |
| `Email__Smtp__Port` | ✅ | SMTP port (e.g. `587`) |
| `Email__Smtp__EnableSsl` | ✅ | `true` for STARTTLS |
| `Email__Smtp__Username` | ✅ | Scaleway SMTP username |
| `Email__Smtp__Password` | ✅ | Scaleway SMTP password |
| `Finnhub__ApiKey` | ✅ | Finnhub market data API key |
| `Mollie__ApiKey` | ✅ | Mollie payment API key (`live_…` or `test_…`) |
| `Mollie__WebhookBaseUrl` | ✅ | Base URL for Mollie webhooks (e.g. `https://api.scraperagent.eu`) |
| `Mollie__RedirectBaseUrl` | ✅ | Base URL for payment redirect (e.g. `https://scraperagent.eu`) |
| `Mollie__MonthlyPrice` | ✅ | Subscription price (e.g. `9.99`) |
| `Mollie__Currency` | ✅ | Currency code (e.g. `EUR`) |
| `TweetSource` | ✅ | `live` for real tweets, `mock` for testing |
| `ReportRecipients` | ✅ | Comma-separated admin email address(es) to also receive reports |
| `SearXNG__BaseUrl` | ⬜ | SearXNG metasearch URL (e.g. `http://searxng:8080`) |
| `TwitterProxy` | ⬜ | Residential proxy URL for tweet scraping (required when `TweetSource=live`) |
| `QuantumID__Authority` | ✅ | OIDC authority (e.g. `https://auth.quantumapi.eu`) |
| `QuantumID__ClientId` | ✅ | OIDC client ID from QuantumID |
| `ASPNETCORE_ENVIRONMENT` | ✅ | `Development` or `Production` |

> ✅ = required, ⬜ = optional  
> \* You need at least one AI provider (Azure OpenAI **or** Scaleway AI).

### 3.2 UI Environment Variables

For local development, create `ui/.env.local`:

```bash
cp ui/.env.local.example ui/.env.local   # if the example exists
# or create it manually:
```

```dotenv
# API endpoint for local development
NEXT_PUBLIC_API_URL=http://localhost:5100

# QuantumID OIDC (Auth.js v5 / NextAuth)
NEXT_PUBLIC_OIDC_AUTHORITY=https://auth.quantumapi.eu
NEXT_PUBLIC_OIDC_CLIENT_ID=<CLIENT_ID from QuantumID>
OIDC_CLIENT_SECRET=<CLIENT_SECRET from QuantumID>

# Auth.js session secret — generate with: qapi random 32 --encoding base64
NEXTAUTH_SECRET=<random 32-byte base64 string>
NEXTAUTH_URL=http://localhost:3000

# Comma-separated list of email addresses allowed to access the admin area
ADMIN_EMAILS=your@email.com
```

---

## 4. Local Development

### Option A — .NET Aspire (recommended)

.NET Aspire orchestrates the API, PostgreSQL, and SearXNG together. The Aspire dashboard shows all services, logs, and traces in one place.

```bash
# 1. Install the Aspire workload (once)
dotnet workload install aspire

# 2. Start the orchestrator (from the repo root)
cd ScraperAgent.AppHost
dotnet run
```

The Aspire dashboard opens automatically. The API is available at `http://localhost:5100`.

> **Note:** The Next.js UI is currently not wired into Aspire due to an upstream bug in `Aspire.Hosting.JavaScript`. Run the UI separately using [Option C](#option-c--ui-only).

### Option B — Docker Compose (home / Windows)

This option runs the API, PostgreSQL, SearXNG, and an optional Cloudflare Tunnel in Docker. It is designed for a Windows home PC with Docker Desktop.

```bash
# 1. Create the .env file from the template
cp .env.home.template .env
# Edit .env and fill in all <PLACEHOLDER> values

# 2. Build and start all services
docker compose -f docker-compose.home.yml up -d --build
```

Services started:

| Service | URL |
|---|---|
| API | `http://localhost:5100` |
| PostgreSQL | `localhost:5432` |
| SearXNG | `http://localhost:8080` (internal network only) |
| Cloudflare Tunnel | Exposes API via the configured tunnel token |

Apply database migrations after the first start (see [Section 5](#5-database-migrations)).

### Option C — UI only

Run the Next.js UI in development mode pointing at any running API.

```bash
cd ui
pnpm install
# Set NEXT_PUBLIC_API_URL in ui/.env.local
pnpm dev
```

The UI is available at `http://localhost:3000`.

---

## 5. Database Migrations

ScraperAgent uses Entity Framework Core with PostgreSQL. Migrations must be applied before the API will start successfully.

```bash
# From the repository root
dotnet ef database update --project ScraperAgent.csproj
```

To create a new migration after changing entities:

```bash
dotnet ef migrations add <MigrationName> --project ScraperAgent.csproj
```

> **Aspire:** When using .NET Aspire, the database container is started automatically. Wait for it to be healthy before running `dotnet ef database update`.
>
> **Docker Compose:** The `api` service waits for the `postgres` health check before starting, but migrations still need to be run manually on first boot. You can run them from outside the container (requires the .NET 8 SDK) while the containers are running:
>
> ```bash
> # Ensure containers are up first
> docker compose -f docker-compose.home.yml up -d
>
> # Run migrations from the host (uses connection string from .env)
> dotnet ef database update --project ScraperAgent.csproj
> ```
>
> Alternatively, exec into the running API container if it includes the EF tools image:
>
> ```bash
> docker compose -f docker-compose.home.yml exec api dotnet ef database update
> ```

---

## 6. Kubernetes Deployment

Kubernetes manifests are in `infra/k8s/scraperagent/`. The cluster is hosted on Scaleway Kapsule.

### 6.1 Configure Secrets

Edit the secret template files and replace all `<PLACEHOLDER>` values **before** applying them. Never commit real credentials.

**API secrets** (`infra/k8s/scraperagent/api/secret.yaml`):

```yaml
stringData:
  ConnectionStrings__configdb: "Host=postgres;Port=5432;Database=scraperagent;Username=scraperagent;Password=<DB_PASSWORD>"
  AzureOpenAI__Endpoint: "<AZURE_OPENAI_ENDPOINT>"
  AzureOpenAI__ApiKey: "<AZURE_OPENAI_KEY>"
  AzureOpenAI__DeploymentName: "gpt-4o"
  ScalewayAI__ApiKey: "<SCALEWAY_AI_KEY>"
  Email__Smtp__Username: "<SMTP_USERNAME>"
  Email__Smtp__Password: "<SMTP_PASSWORD>"
  Finnhub__ApiKey: "<FINNHUB_KEY>"
  Mollie__ApiKey: "<MOLLIE_LIVE_KEY>"
  TwitterProxy: "<RESIDENTIAL_PROXY_URL>"
  QuantumID__Authority: "https://auth.quantumapi.eu"
  QuantumID__ClientId: "<CLIENT_ID>"
```

**UI secrets** (`infra/k8s/scraperagent/ui/secret.yaml`):

```yaml
stringData:
  NEXT_PUBLIC_OIDC_AUTHORITY: "https://auth.quantumapi.eu"
  NEXT_PUBLIC_OIDC_CLIENT_ID: "<CLIENT_ID>"
  OIDC_CLIENT_SECRET: "<CLIENT_SECRET>"
  NEXTAUTH_SECRET: "<NEXTAUTH_SECRET>"
  NEXTAUTH_URL: "https://scraperagent.eu"
  ADMIN_EMAILS: "<COMMA_SEPARATED_ADMIN_EMAILS>"
```

### 6.2 Apply Manifests

```bash
# Create the namespace first
kubectl apply -f infra/k8s/scraperagent/namespace.yaml

# PostgreSQL
kubectl apply -f infra/k8s/scraperagent/postgres/

# API (ConfigMap + Secret + Deployment + Service)
kubectl apply -f infra/k8s/scraperagent/api/

# UI (Secret + Deployment + Service)
kubectl apply -f infra/k8s/scraperagent/ui/

# Ingress (routes api.scraperagent.eu → API, scraperagent.eu → UI)
kubectl apply -f infra/k8s/scraperagent/ingress.yaml
```

### 6.3 Apply Database Migrations in Kubernetes

After the API pod is running, exec into it to run migrations:

```bash
kubectl exec -n scraperagent deploy/scraperagent-api -- \
  dotnet ef database update
```

### 6.4 Ingress Routes

| Host | Target |
|---|---|
| `scraperagent.eu` | UI service |
| `api.scraperagent.eu` | API service |

---

## 7. Verification Checklist

After setup, verify each component is working:

- [ ] **API health** — `curl http://localhost:5100/api/version` returns `200 OK`
- [ ] **Database** — API starts without EF Core migration errors in the logs
- [ ] **AI** — Trigger a test analysis: `POST /api/market/analyze` returns `202 Accepted`
- [ ] **Email** — An analysis job completes and sends a report to `ReportRecipients`
- [ ] **UI** — `http://localhost:3000` loads the marketing homepage
- [ ] **Auth** — Navigating to `/dashboard` redirects to the QuantumID login page
- [ ] **Payments** — Mollie webhook endpoint responds to a test event from the Mollie dashboard

---

## 8. Troubleshooting

### API fails to start — missing configuration

Check the startup logs for `System.InvalidOperationException` or `KeyNotFoundException`. All required environment variables in [Section 3.1](#31-api-environment-variables) must be set.

### Database connection refused

Ensure PostgreSQL is running and the connection string in `ConnectionStrings__configdb` matches the host, port, database name, username, and password exactly.

### Tweets are not scraped

If `TweetSource=live` and scraping fails, the residential proxy may be unreachable or blocked. Switch to `TweetSource=mock` to test the analysis pipeline without real tweets.

### OIDC login redirects to an error page

1. Confirm the redirect URI `<base-url>/api/auth/callback/quantumid` is registered in QuantumID.
2. Verify `NEXT_PUBLIC_OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `NEXTAUTH_URL` are all set correctly in the UI environment.
3. Run `qapi apps get <APP_ID>` to inspect the app's current configuration.

### Emails are not delivered

1. Confirm the sender domain is verified in Scaleway Transactional Email.
2. Check `Email__Smtp__Username` and `Email__Smtp__Password` are correct.
3. Verify `Email__Enabled=true` is set in the API environment (Kubernetes ConfigMap).

### Mollie webhook returns 404

The webhook URL registered in the Mollie dashboard must exactly match `Mollie__WebhookBaseUrl` + `/api/webhook/mollie`. Ensure the API is reachable from the public internet (not `localhost`).
