# Build Auth — ATLAS Workflow

## Goal

Add authentication to ScraperAgent using **QuantumID.eu** as the OIDC provider. Protect API routes and the UI so only authenticated users can access the system.

---

## A — Architect

### App Brief

- **Problem:** ScraperAgent has no authentication. Anyone with the URL can use the app and trigger expensive analysis jobs.
- **User:** Internal administrators/users of the system (not the general public).
- **Success:** Only users with a QuantumID.eu account can access the UI and call the API. Unauthenticated requests return 401.
- **Constraints:**
  - Use QuantumID.eu as the sole OIDC provider (no custom credential management)
  - Must be compatible with the existing stack: ASP.NET Web API (.NET 8.0) + Next.js UI
  - Must not break the existing analysis pipeline
  - No passwords stored in our own database
  - Must work in the Scaleway K8s environment

---

## T — Trace

### Data Schema

No new tables are required for basic authentication. The `sub` claim from the QuantumID JWT is the user identifier.

If user persistence is needed in the future:

```
Tables:
- users (id, oidc_sub, email, name, created_at, last_login)

Relationships:
- users 1:N reports (to filter reports by user, if required)
```

For now: no schema changes. Identity is derived entirely from the JWT token.

### Integrations Map

| Service | Purpose | Auth Type | Notes |
|---------|---------|-----------|-------|
| QuantumAPI / QuantumID | OIDC Provider | OIDC / OAuth2 | Authority: `https://auth.quantumapi.eu` — Discovery: `https://auth.quantumapi.eu/.well-known/openid-configuration` |
| ASP.NET API | Validate Bearer JWT tokens | JWT (RS256) | `JwtBearer` middleware — authority `https://auth.quantumapi.eu`, automatic JWKS resolution |
| Next.js UI | Handle OIDC flow, manage sessions | OIDC callback | Auth.js (NextAuth v5) with OIDC provider pointing to `https://auth.quantumapi.eu` |
| PostgreSQL | (Optional) session storage | — | Only if Auth.js requires a DB adapter |

### Technology Stack

**Backend (ASP.NET):**
- `Microsoft.AspNetCore.Authentication.JwtBearer` — validate tokens issued by QuantumID
- `RequireAuthorization()` on all analysis and configuration endpoints
- Configure `Authority`, `Audience`, `ValidateIssuer` via appsettings / env vars

**Frontend (Next.js):**
- `next-auth` (Auth.js v5) with a generic OIDC provider pointing to QuantumID.eu
- Next.js Middleware to protect all routes except `/api/auth/**`
- Session propagated to the API via Bearer token in request headers

**Infrastructure:**
- K8s Secrets (API): `QuantumID__Authority`, `QuantumID__ClientId`, `QuantumID__ClientSecret`
- K8s Secrets (UI): `NEXT_PUBLIC_OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### QuantumID OIDC Endpoints

| Endpoint | URL |
| --- | --- |
| Authority / Issuer | `https://auth.quantumapi.eu` |
| Discovery | `https://auth.quantumapi.eu/.well-known/openid-configuration` |
| Authorization | `https://auth.quantumapi.eu/connect/authorize` |
| Token | `https://auth.quantumapi.eu/connect/token` |
| UserInfo | `https://auth.quantumapi.eu/connect/userinfo` |
| Logout | `https://auth.quantumapi.eu/connect/logout` |
| Introspect | `https://auth.quantumapi.eu/connect/introspect` |
| Revoke | `https://auth.quantumapi.eu/connect/revocation` |

**Scopes:** `openid profile email api tenant offline_access`

**Claims mapping:** `NameClaimType = "name"`, `RoleClaimType = "role"`

### Authentication Flow

```
User → Next.js UI
   ↓ (unauthenticated)
Next.js Middleware → redirect to /api/auth/signin
   ↓
Auth.js → redirect to https://auth.quantumapi.eu/connect/authorize?...
   ↓ (user logs in at QuantumID)
QuantumAPI → callback to /api/auth/callback/quantumid
   ↓
Auth.js stores session (httpOnly cookie) → redirects back to the app
   ↓
UI makes requests to the API with `Authorization: Bearer <access_token>`
   ↓
ASP.NET validates JWT against https://auth.quantumapi.eu JWKS → 200 OK
```

### Edge Cases

- Expired token: API returns 401, UI redirects to re-login
- QuantumID unavailable: show "authentication service unavailable" error
- User without a QuantumID account: QuantumID handles the error, not our app
- JWKS key rotation: `JwtBearer` with `RefreshOnIssuerKeyNotFound = true` handles this automatically
- CORS: API must allow the UI origin in its CORS policy

---

## L — Link

### Connection Validation Checklist

```
[ ] QuantumAPI Discovery endpoint accessible:
    GET https://auth.quantumapi.eu/.well-known/openid-configuration
    → must return JSON with issuer, jwks_uri, authorization_endpoint, token_endpoint

[ ] Client app registered in QuantumAPI dashboard (redirect URI configured):
    Redirect URI: https://<ui-domain>/api/auth/callback/quantumid

[ ] ASP.NET can resolve the JWKS:
    GET <jwks_uri from discovery response>
    → must return valid keys

[ ] Environment variables available in K8s Secrets:
    API:  QuantumID__Authority, QuantumID__ClientId, QuantumID__ClientSecret
    UI:   NEXT_PUBLIC_OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL

[ ] ASP.NET test endpoint returns 401 without a token:
    GET /api/analysis → 401 Unauthorized

[ ] ASP.NET test endpoint returns 200 with a valid token:
    GET /api/analysis with Authorization: Bearer <token> → 200 OK
```

### How to Obtain a Test Token

```bash
# Client Credentials flow (machine-to-machine, supported by QuantumAPI):
curl -X POST https://auth.quantumapi.eu/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=...&client_secret=...&scope=openid api"

# Or via qapi CLI (QuantumAPI's official CLI tool):
qapi auth login
qapi auth token

# Once Auth.js is configured, extract the access_token from the UI session:
# console.log((await getSession())?.access_token)
```

---

## A — Assemble

### Build Order

1. **Backend first** — protect the API with JWT Bearer (validate with curl, no UI needed)
2. **Frontend second** — integrate Auth.js in Next.js, complete OIDC flow
3. **K8s secrets** — add variables to each deployment's Secret
4. **Next.js Middleware** — protect UI routes

### Changes per Layer

**ASP.NET API (`ScraperAgent.Api/`):**

- `Program.cs`: add `AddAuthentication().AddJwtBearer()` with QuantumID authority
- `appsettings.json`: add `QuantumID` section per docs pattern:

  ```json
  {
    "QuantumID": {
      "Authority": "https://auth.quantumapi.eu",
      "ClientId": "",
      "Scopes": "openid profile email api tenant offline_access"
    }
  }
  ```

- `Endpoints/AnalysisEndpoints.cs`: add `RequireAuthorization()`
- `Endpoints/ConfigEndpoints.cs`: add `RequireAuthorization()`
- K8s Secret: `QuantumID__Authority`, `QuantumID__ClientId`, `QuantumID__ClientSecret`

**Next.js UI (`ui/`):**

- Install: `pnpm add next-auth`
- Create: `app/api/auth/[...nextauth]/route.ts` — OIDC provider with issuer `https://auth.quantumapi.eu`
- Create: `middleware.ts` at the root to protect all routes except `/api/auth/**`
- Update: all API fetch calls to include `Authorization: Bearer` header (token from session)
- K8s ConfigMap: `NEXT_PUBLIC_OIDC_AUTHORITY=https://auth.quantumapi.eu`, `NEXT_PUBLIC_OIDC_CLIENT_ID`, `NEXTAUTH_URL`
- K8s Secret: `OIDC_CLIENT_SECRET`, `NEXTAUTH_SECRET`

**K8s (`infra/k8s/scraperagent/`):**

- `api/secret.yaml`: add `QuantumID__Authority`, `QuantumID__ClientId`, `QuantumID__ClientSecret`
- `ui/secret.yaml`: add `OIDC_CLIENT_SECRET`, `NEXTAUTH_SECRET`
- `ui/configmap.yaml`: add `NEXT_PUBLIC_OIDC_AUTHORITY`, `NEXT_PUBLIC_OIDC_CLIENT_ID`, `NEXTAUTH_URL`

---

## S — Stress-test

### Functional Testing

```
[ ] No token → API returns 401
[ ] Invalid / expired token → API returns 401
[ ] Valid token → API returns 200
[ ] Unauthenticated user in UI → redirected to QuantumID login
[ ] After login → redirected back to the original page
[ ] Logout → session destroyed, redirected to login
[ ] Page refresh → session persists (valid cookie)
```

### Integration Testing

```
[ ] Full flow: login → trigger analysis → logout works end-to-end
[ ] UI token is sent correctly to the API on every request
[ ] JWKS refreshes on key rotation (manual test or wait for expiry)
[ ] K8s pods start correctly with the new environment variables
```

### Edge Cases

```
[ ] QuantumID down: UI shows a clear error, not a blank screen
[ ] Token expires mid-session: UI auto-refreshes or prompts re-login
[ ] Direct /api access without UI: returns 401 as JSON (not HTML redirect)
[ ] CORS: requests from UI to API do not fail due to missing headers
```

### User Acceptance

```
[ ] Login is seamless: 1 click → QuantumID → back in the app
[ ] No repeated login prompts within the same session
[ ] UI displays the logged-in user (name / email from claims)
[ ] Logout works and prevents returning without re-authenticating
```

---

## Anti-Patterns to Avoid

1. **Validating tokens in the UI** — real validation must always happen in the backend
2. **Storing the access_token in localStorage** — use httpOnly cookies via Auth.js
3. **Hardcoding the Client Secret in code** — always use K8s Secrets / env vars
4. **Disabling SSL validation to QuantumID** — never in production
5. **Protecting only some routes** — protect all endpoints by default; be explicit about exceptions

---

## Related Files

- **Infra:** `infra/k8s/scraperagent/api/secret.yaml`
- **API entry:** `ScraperAgent.Api/Program.cs`
- **API endpoints:** `ScraperAgent.Api/Endpoints/`
- **UI auth route:** `ui/app/api/auth/[...nextauth]/route.ts` (to be created)
- **UI middleware:** `ui/middleware.ts` (to be created)
