# Setting Up a QuantumID OIDC App with qapi

> This document serves two purposes:
> 1. **Runbook** — the exact commands to configure QuantumID for ScraperAgent.
> 2. **Tutorial** — a reusable reference for wiring any new application into QuantumID via the `qapi` CLI.

---

## Prerequisites

### Install qapi

```bash
# macOS (recommended)
brew install quantumapi-eu/tap/qapi

# Or via script
curl -sSL https://docs.quantumapi.eu/cli/install.sh | sh

# Verify
qapi version
```

### Authenticate

```bash
qapi login
# Opens browser → OAuth2 PKCE flow → tokens stored in ~/.quantumapi/tokens.json

# Confirm who you are
qapi whoami
```

> **API key alternative:** If running headless (CI/CD), export `QAPI_API_KEY=mislata_sk_xxx` instead of `qapi login`.

---

## Step 1 — Create the Web Application

The **Next.js UI** uses Auth.js (server-side session), so the correct type is `WebApp`. This app will handle the Authorization Code flow with PKCE and receive a `client_secret`.

```bash
qapi apps create "ScraperAgent UI" \
  --type WebApp \
  --description "ScraperAgent admin dashboard — Next.js + Auth.js v5" \
  --environment production \
  --redirect-uri "https://scraperagent.eu/api/auth/callback/quantumid" \
  --redirect-uri "http://localhost:3000/api/auth/callback/quantumid" \
  --post-logout-redirect-uri "https://scraperagent.eu" \
  --scopes "openid,profile,email,api,tenant,offline_access"
```

Save the output — it contains the `CLIENT_ID` and `CLIENT_SECRET` you will need.

> **Redirect URI format for Auth.js:** Always `<base-url>/api/auth/callback/<provider-id>`.
> The provider ID in `auth.ts` is `"quantumid"`, so the path must end in `/callback/quantumid`.

---

## Step 2 — Verify the Application

```bash
# List all apps to confirm it was created
qapi apps list

# Get full details by APP_ID (returned from create)
qapi apps get <APP_ID>

# To see quickstart instructions for Next.js
qapi apps get <APP_ID> --quickstart
```

---

## Step 3 — Create a Machine-to-Machine App (for testing)

Create a separate M2M app to test the API's JWT validation without needing a browser login.

```bash
qapi apps create "ScraperAgent API Test" \
  --type MachineToMachine \
  --description "M2M client for testing API JWT validation" \
  --environment development \
  --scopes "openid,api"
```

Use this to get tokens via `client_credentials` for `curl` testing.

---

## Step 4 — Generate NEXTAUTH_SECRET

`NEXTAUTH_SECRET` is used by Auth.js to encrypt session cookies. Generate a cryptographically strong value using QuantumAPI's quantum random number generator:

```bash
qapi random 32 --encoding base64
# Example output: kX9mP2vQr7nL0sT4wY6hJ3cF8iA1bE5d...
```

Store this value as `NEXTAUTH_SECRET` in the UI K8s secret.

---

## Step 5 — Configure K8s Secrets

### API secret (`infra/k8s/scraperagent/api/secret.yaml`)

Add these entries to `stringData`:

```yaml
QuantumID__Authority: "https://auth.quantumapi.eu"
QuantumID__ClientId: "<CLIENT_ID from Step 1>"
```

> The API only needs the Authority for JWKS resolution. It does not participate in the OIDC flow.

### UI secret (`infra/k8s/scraperagent/ui/secret.yaml`)

Replace `ADMIN_PASSWORD` with:

```yaml
NEXT_PUBLIC_OIDC_AUTHORITY: "https://auth.quantumapi.eu"
NEXT_PUBLIC_OIDC_CLIENT_ID: "<CLIENT_ID from Step 1>"
OIDC_CLIENT_SECRET: "<CLIENT_SECRET from Step 1>"
NEXTAUTH_SECRET: "<value from Step 4>"
NEXTAUTH_URL: "https://scraperagent.eu"
```

---

## Step 6 — Verify the OIDC Discovery Endpoint

Before touching any code, confirm the Identity provider is reachable and the app's client is registered:

```bash
# 1. Confirm discovery is live
curl https://auth.quantumapi.eu/.well-known/openid-configuration | jq '{issuer, authorization_endpoint, token_endpoint, jwks_uri}'

# 2. Get a test token using the M2M app (from Step 3)
curl -s -X POST https://auth.quantumapi.eu/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=<M2M_CLIENT_ID>&client_secret=<M2M_CLIENT_SECRET>&scope=openid api" \
  | jq '{access_token, token_type, expires_in}'

# 3. Use the token against the ScraperAgent API
curl -X POST http://localhost:5100/api/market/analyze \
  -H "Authorization: Bearer <access_token from above>"
# Expected: 202 Accepted (not 401)
```

---

## Step 7 — Rotate the Client Secret (when needed)

```bash
qapi apps rotate-secret <APP_ID>
# Generates a new secret — update ui/secret.yaml and redeploy
```

---

## Troubleshooting

```bash
# Check your login status and current tenant
qapi whoami

# Debug connectivity to the QuantumAPI endpoint
qapi debug

# View all your apps
qapi apps list --output json

# Check the OIDC discovery document manually
curl https://auth.quantumapi.eu/.well-known/openid-configuration
```

---

## Summary — What Was Created

| Resource | Type | Purpose |
| --- | --- | --- |
| ScraperAgent UI | WebApp | Auth.js OIDC flow in Next.js |
| ScraperAgent API Test | MachineToMachine | curl testing of API JWT validation |
| `NEXTAUTH_SECRET` | Random (32 bytes) | Auth.js session cookie encryption |

---

## Reusing This Pattern for a New App

Replace the app name, redirect URIs, and env var destinations. The core flow is always:

```
qapi login
qapi apps create "My App" --type WebApp --redirect-uri ... --scopes "openid,profile,email,api,tenant,offline_access"
qapi random 32 --encoding base64   # → NEXTAUTH_SECRET
# Configure env vars → implement auth → test with M2M token
```

For SPAs (no server-side secret): use `--type SPA` instead of `WebApp`. SPAs receive no `client_secret` and use PKCE only.
