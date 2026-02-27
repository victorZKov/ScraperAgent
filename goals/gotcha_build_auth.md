# GOTCHA: Add QuantumID OIDC Authentication

> AI execution instructions derived from `goals_build_auth.md` (ATLAS).
> Work through G → O → T → C → H → A in order. Do not skip phases.

---

## G — Goals

What this task must achieve when complete:

1. The ASP.NET API has **no authentication today** — add `JwtBearer` so every admin endpoint returns `401` without a valid token.
2. The Next.js UI uses a **single shared `ADMIN_PASSWORD` cookie** — replace it entirely with QuantumID OIDC via Auth.js v5.
3. **Public routes stay public.** Do not break subscriber flows or the Mollie webhook.
4. The logged-in user's name/email is visible in the admin UI header.
5. No passwords are stored. No schema changes. Identity comes from the JWT.

---

## O — Orchestration

Build in this exact order. Each phase must be functional before starting the next.

### Phase 1 — API: Add JwtBearer (no UI needed yet)

**File: `Program.cs`**

After the existing CORS registration (`builder.Services.AddCors(...)`), add:

```csharp
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
```

After `app.UseCors();`, add:

```csharp
app.UseAuthentication();
app.UseAuthorization();
```

**File: `Endpoints/AnalysisEndpoints.cs`**

On `MapAnalysisEndpoints`, chain `.RequireAuthorization()` to every route:

```csharp
app.MapPost("/api/{domain}/analyze", TriggerAnalysis).RequireAuthorization();
app.MapGet("/api/{domain}/jobs/{jobId}", GetJobStatus).RequireAuthorization();
app.MapGet("/api/{domain}/reports/{reportId}", GetReport).RequireAuthorization();
app.MapGet("/api/{domain}/reports", ListReports).RequireAuthorization();
app.MapGet("/api/reports", ListAllReports).RequireAuthorization();
app.MapPost("/api/{domain}/reports/{reportId}/resend-email", ResendEmail).RequireAuthorization();
```

**File: `Endpoints/ConfigEndpoints.cs`**

The `config` group covers experts, recipients, ai-models, and schedules — all admin. Add authorization at the group level:

```csharp
var config = app.MapGroup("/api/config").RequireAuthorization();
```

**File: `Endpoints/SubscriptionEndpoints.cs`**

The `sub` group (`/api/subscribe/*`) and the Mollie webhook are **public** — leave them as-is.
The `admin` group (`/api/config/subscribers`, `/api/config/subscribers/stats`, `/api/registration/status`) is admin — add authorization at the group level:

```csharp
var admin = app.MapGroup("/api/config").RequireAuthorization();
```

**File: `appsettings.json`**

Add the `QuantumID` section:

```json
"QuantumID": {
  "Authority": "https://auth.quantumapi.eu"
}
```

`ClientId` and `ClientSecret` are not needed in the API — only the Authority for JWKS resolution.

**Verify Phase 1:**

```bash
curl http://localhost:5100/api/market/analyze -X POST
# Expected: 401 Unauthorized (JSON)

curl http://localhost:5100/api/subscribe/ -X POST -H "Content-Type: application/json" -d "{}"
# Expected: 400 or 422 (NOT 401 — this route stays public)
```

---

### Phase 2 — UI: Replace admin-login with Auth.js OIDC

**Delete these files** (the old password-based auth):

- `ui/app/api/admin-login/route.ts`
- `ui/app/admin-login/page.tsx`

**Install dependency:**

```bash
cd ui && pnpm add next-auth
```

**Create: `ui/auth.ts`** (Auth.js v5 config, single source of truth):

```typescript
import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "quantumid",
      name: "QuantumID",
      type: "oidc",
      issuer: process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
      clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
    },
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      (session as any).access_token = token.access_token;
      return session;
    },
  },
});
```

**Create: `ui/app/api/auth/[...nextauth]/route.ts`:**

```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

**Replace: `ui/middleware.ts`** (full file replacement):

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ADMIN_PATHS = ["/dashboard", "/settings", "/reports"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isAdminPath) return NextResponse.next();
  if (req.auth) return NextResponse.next();

  const signInUrl = new URL("/api/auth/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", req.url);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/reports/:path*"],
};
```

**Update: `ui/app/(admin)/layout.tsx`**

Add session display to the nav header. Import `auth` and show `session.user.name` or `session.user.email`:

```typescript
import { auth } from "@/auth";
// In the server component:
const session = await auth();
// In the nav, add a user indicator and sign-out button next to the existing nav items
```

**Update: API fetch calls in admin pages**

Every `fetch` call to the API in `ui/app/(admin)/` must include the Bearer token. The pattern is:

```typescript
import { auth } from "@/auth";

const session = await auth();
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/...`, {
  headers: {
    Authorization: `Bearer ${(session as any)?.access_token}`,
  },
});
```

---

### Phase 3 — K8s: Update secrets

**File: `infra/k8s/scraperagent/api/secret.yaml`**

Add to `stringData`:

```yaml
QuantumID__Authority: "https://auth.quantumapi.eu"
QuantumID__ClientId: "<QUANTUMID_CLIENT_ID>"
```

`ClientSecret` is not needed on the API side (JwtBearer only validates tokens, doesn't issue them).

**File: `infra/k8s/scraperagent/ui/secret.yaml`**

Replace the existing `ADMIN_PASSWORD` entry with:

```yaml
NEXT_PUBLIC_OIDC_AUTHORITY: "https://auth.quantumapi.eu"
NEXT_PUBLIC_OIDC_CLIENT_ID: "<QUANTUMID_CLIENT_ID>"
OIDC_CLIENT_SECRET: "<QUANTUMID_CLIENT_SECRET>"
NEXTAUTH_SECRET: "<RANDOM_32_CHAR_STRING>"
NEXTAUTH_URL: "https://scraperagent.eu"
```

---

## T — Tools

Use exactly these. Do not substitute.

| Layer | Tool | How to obtain |
| --- | --- | --- |
| ASP.NET auth | `Microsoft.AspNetCore.Authentication.JwtBearer` | Already in ASP.NET Core SDK — no new NuGet needed |
| Next.js auth | `next-auth` (Auth.js v5) | `pnpm add next-auth` in `ui/` |
| OIDC provider | QuantumAPI / QuantumID | `https://auth.quantumapi.eu` |
| Token testing | `curl` or `qapi` CLI | `qapi auth login && qapi auth token` |
| K8s secrets | Existing secret pattern | Follow `api/secret.yaml` double-underscore convention |

---

## C — Context

Critical background the AI must know before touching any file.

### Existing auth state (what you are REPLACING)

| Location | Current mechanism | Replace with |
| --- | --- | --- |
| `ui/middleware.ts` | Checks `admin-token` cookie value `"authenticated"` | Auth.js `auth()` session check |
| `ui/app/api/admin-login/route.ts` | POST handler, validates `ADMIN_PASSWORD` env var, sets cookie | Delete entirely |
| `ui/app/admin-login/page.tsx` | Password form UI | Delete entirely |
| `infra/.../ui/secret.yaml` | `ADMIN_PASSWORD` | OIDC env vars |
| `Program.cs` | No auth at all | JwtBearer |

### Route taxonomy

| Route group | Public or Protected | Reason |
| --- | --- | --- |
| `GET /api/version` | Public | Health check |
| `POST/GET /api/subscribe/*` | **Public** | User-facing subscription flows |
| `POST /api/subscribe/webhooks/mollie` | **Public** | Mollie calls this — cannot be protected |
| `POST /api/{domain}/analyze` | Protected | Admin-only operation |
| `GET /api/{domain}/jobs/*` | Protected | Admin-only |
| `GET /api/{domain}/reports/*` | Protected | Admin-only |
| `GET/POST/PUT/DELETE /api/config/*` | Protected | All config is admin |
| `GET /api/config/subscribers/*` | Protected | Admin-only subscriber management |

### appsettings.json / K8s env var convention

.NET reads env vars with `__` as the section separator. `QuantumID__Authority` in K8s becomes `QuantumID:Authority` in C# config. This is the established pattern in this project (see `Email__Smtp__Host`, `SearXNG__BaseUrl`).

### Auth.js v5 token forwarding

Auth.js stores the `access_token` in the JWT session cookie. To forward it to the API, the `jwt` and `session` callbacks in `auth.ts` must explicitly copy `account.access_token` into the session (see Orchestration Phase 2). Without these callbacks, `session.access_token` will be `undefined`.

### CORS

The API currently uses `AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()`. This is compatible with Bearer token auth (Authorization header). Do **not** change the CORS policy — it is not blocking anything.

### next-auth is not installed

`next-auth` is not in `ui/package.json`. It must be installed with `pnpm add next-auth` before any import works.

---

## H — Heuristics

Rules to enforce throughout. Treat these as hard constraints.

1. **API returns JSON 401, not HTML.** ASP.NET's default JwtBearer behavior returns JSON. Do not add cookie authentication to the API.

2. **Token validation happens only in the API.** The UI trusts the session object from Auth.js. Never write JWT parsing or verification code in the UI.

3. **`access_token` must stay in httpOnly cookies.** Auth.js handles this by default. Do not expose it via `getSession()` to client components or store it in `localStorage`.

4. **Public routes must not require a token.** `/api/subscribe/*` and `/api/version` must return their normal responses without an `Authorization` header. Verify this explicitly.

5. **Do not break the marketing site.** `ui/app/(marketing)/*` routes are public and must remain accessible without login. The middleware matcher only covers `['/dashboard/:path*', '/settings/:path*', '/reports/:path*']` — do not widen it.

6. **No secrets in code or git.** Credentials go in K8s secrets / `.env.local`. The template files already use `<PLACEHOLDER>` convention — maintain it.

7. **One provider, one source of truth.** Auth config lives in `ui/auth.ts`. The `[...nextauth]/route.ts` only re-exports `handlers`. Do not duplicate configuration.

8. **`ValidateAudience = false` on JwtBearer.** The correct audience value depends on the QuantumID client setup which is not known at build time. Disable audience validation for now — it can be tightened once the client ID is confirmed.

---

## A — Args

Concrete values to use. No placeholders — use these exactly.

### QuantumID OIDC

| Parameter | Value |
| --- | --- |
| Authority / Issuer | `https://auth.quantumapi.eu` |
| Discovery URL | `https://auth.quantumapi.eu/.well-known/openid-configuration` |
| Token endpoint | `https://auth.quantumapi.eu/connect/token` |
| Scopes | `openid profile email api tenant offline_access` |
| Provider ID (Auth.js) | `quantumid` |
| Callback URL | `https://scraperagent.eu/api/auth/callback/quantumid` |
| Claims | `NameClaimType = "name"`, `RoleClaimType = "role"` |

### Environment variable names (exact)

| Variable | Layer | Where |
| --- | --- | --- |
| `QuantumID__Authority` | API | `api/secret.yaml` |
| `QuantumID__ClientId` | API | `api/secret.yaml` |
| `NEXT_PUBLIC_OIDC_AUTHORITY` | UI | `ui/secret.yaml` |
| `NEXT_PUBLIC_OIDC_CLIENT_ID` | UI | `ui/secret.yaml` |
| `OIDC_CLIENT_SECRET` | UI | `ui/secret.yaml` |
| `NEXTAUTH_SECRET` | UI | `ui/secret.yaml` |
| `NEXTAUTH_URL` | UI | `ui/secret.yaml` |

### Acceptance criteria (all must pass before done)

```
[ ] curl POST /api/market/analyze (no token)    → 401 JSON
[ ] curl POST /api/market/analyze (valid token) → 202 Accepted
[ ] curl POST /api/subscribe/ (no token)        → 400/422 (NOT 401)
[ ] curl GET  /api/version (no token)           → 200 OK
[ ] Browser: /dashboard (unauthenticated)       → redirects to QuantumID
[ ] Browser: /dashboard (authenticated)         → renders dashboard
[ ] Browser: logout                             → session cleared, redirected
[ ] Page refresh (authenticated)               → session persists, no re-login
[ ] Admin layout shows logged-in user name/email
[ ] K8s pods restart without errors with new env vars
```
