# ScraperAgent — Claude Instructions

## What this project is

ScraperAgent is a market and crypto intelligence platform. It scrapes expert Twitter accounts, runs AI analysis via Scaleway/Azure OpenAI, and emails reports to subscribers.

- **API**: ASP.NET Web API (.NET 8.0) — root of the repo (`Program.cs`, `Endpoints/`, `Services/`, `Workers/`)
- **UI**: Next.js 15 — `ui/`
- **DB**: PostgreSQL — reports + config stored as JSONB
- **Infra**: Kubernetes on Scaleway — `infra/k8s/scraperagent/`
- **Local dev**: .NET Aspire (`ScraperAgent.AppHost/`)

## How tasks are organized

This project uses the **ATLAS + GOTCHA** workflow.

- **ATLAS** (`goals/goals_*.md`) — human-authored planning docs (problem, design, validation checklist).
- **GOTCHA** (`goals/gotcha_*.md`) — AI execution instructions derived from ATLAS. **Start here when implementing a feature.**
- **Manifest** (`goals/manifest.md`) — index of all features and their current status.

**When asked to implement a feature: read the corresponding GOTCHA file first. It contains exact file paths, code snippets, build order, and acceptance criteria.**

## Current feature status

| Feature | Status | GOTCHA | Setup |
| --- | --- | --- | --- |
| Authentication (QuantumID OIDC) | **Ready to implement** | `goals/gotcha_build_auth.md` | `goals/setup_quantumid_app.md` |

### Authentication — where things stand

The codebase has **no real authentication today**:

- The API (`Program.cs`) has zero auth middleware — all endpoints are open.
- The UI uses a single shared `ADMIN_PASSWORD` cookie (`ui/middleware.ts`, `ui/app/api/admin-login/`).

Before implementing the code, run `goals/setup_quantumid_app.md` to provision the OIDC client in QuantumID and obtain `CLIENT_ID` and `CLIENT_SECRET`. Then execute `goals/gotcha_build_auth.md` to implement the code changes.

**Current progress and issues:** `goals/progress_build_auth.md` — read this first to know where to resume.

## Key conventions

- **UI package manager**: `pnpm` (never `npm`)
- **Documentation language**: English only
- **K8s env var convention**: double underscore maps to .NET config sections — `QuantumID__Authority` → `QuantumID:Authority`
- **JSON serialization**: PascalCase (not camelCase) — matches TypeScript types
- **Never commit real credentials** — K8s secret files use `<PLACEHOLDER>` convention

## Tech stack quick reference

| Layer | Technology |
| --- | --- |
| API framework | ASP.NET Minimal API (.NET 8) |
| Background jobs | `Channel<T>` + `BackgroundService` |
| ORM | EF Core + Npgsql |
| AI | Scaleway Generative APIs (OpenAI-compatible) + Azure OpenAI |
| Email | MailKit → Scaleway SMTP |
| UI | Next.js 15 + Tailwind |
| Auth (target) | Auth.js v5 (NextAuth) + QuantumID OIDC |
| Infra | Scaleway K8s + Kapsule |

## Where to find things

| What | Where |
| --- | --- |
| API entry point | `Program.cs` |
| API routes | `Endpoints/AnalysisEndpoints.cs`, `Endpoints/ConfigEndpoints.cs`, `Endpoints/SubscriptionEndpoints.cs` |
| Background workers | `Workers/AnalysisBackgroundService.cs`, `Workers/SchedulerBackgroundService.cs` |
| DB context + migrations | `Data/` |
| UI pages (admin) | `ui/app/(admin)/` |
| UI pages (public) | `ui/app/(marketing)/` |
| UI auth (current) | `ui/middleware.ts`, `ui/app/api/admin-login/` |
| K8s API config | `infra/k8s/scraperagent/api/configmap.yaml`, `api/secret.yaml` |
| K8s UI config | `infra/k8s/scraperagent/ui/secret.yaml` |
| Feature goals | `goals/manifest.md` |
