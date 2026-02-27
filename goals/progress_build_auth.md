# Progress: Authentication — QuantumID OIDC

> Living document. Update this file as work progresses.
> Reference: GOTCHA → `goals/gotcha_build_auth.md` | Setup → `goals/setup_quantumid_app.md`

---

## Overall Status

**Phase** | **Status**
--- | ---
Setup — QuantumID app provisioning (`qapi`) | ✅ Done
Phase 1 — API: JwtBearer | ✅ Done
Phase 2 — UI: Auth.js OIDC | ✅ Done
Phase 3 — K8s: Secrets update | ✅ Done
Acceptance criteria (all green) | 🔄 In progress — needs QuantumID client provisioning first

> Legend: ⬜ Not started · 🔄 In progress · ✅ Done · ❌ Blocked

---

## Setup — QuantumID App Provisioning

### Commands run

```
qapi login
qapi apps create "ScraperAgent UI" --type WebApp --environment production \
  --redirect-uri "https://scraperagent.eu/api/auth/callback/quantumid" \
  --redirect-uri "http://localhost:3000/api/auth/callback/quantumid" \
  --post-logout-redirect-uri "https://scraperagent.eu" \
  --scopes "openid,profile,email,api,tenant,offline_access"
# redirect URI production added via direct PUT (qapi update bug workaround)
openssl rand -base64 32  # → NEXTAUTH_SECRET
```

### Credentials obtained

- **WebApp CLIENT_ID**: `kovimatic_scraperagent-ui`
- **WebApp APP_ID**: `8fc5b032-c69a-4897-98d1-84a000ccca69`
- **M2M CLIENT_ID**: N/A — M2M creation returns 400 (possible plan limitation; not blocking)
- Secrets stored in K8s: ✅ (real values filled into api/secret.yaml and ui/secret.yaml)

### Issues

- `qapi apps list` — bug: CLI expects `{"apps":[]}` but API returns raw array (fixed by using direct curl to `/api/v1/applications`)
- `qapi apps update --add-redirect-uri` — returns "Bad Request: Unknown error" (worked around via direct PUT)
- M2M app creation fails with 400 (no error body) — not blocking; JWT testing can use `qapi auth token` from CLI session instead

---

## Phase 1 — API: JwtBearer

### Files changed

- [x] `Program.cs` — AddAuthentication + UseAuthentication + UseAuthorization
- [x] `appsettings.json` — QuantumID section added
- [x] `Endpoints/AnalysisEndpoints.cs` — RequireAuthorization on all routes
- [x] `Endpoints/ConfigEndpoints.cs` — RequireAuthorization on config group
- [x] `Endpoints/SubscriptionEndpoints.cs` — RequireAuthorization on admin group

### Verification

- [ ] `curl POST /api/market/analyze` (no token) → 401 JSON
- [ ] `curl POST /api/subscribe/` (no token) → 400/422 (NOT 401)
- [ ] `curl GET /api/version` (no token) → 200 OK

### Issues

_None yet._

---

## Phase 2 — UI: Auth.js OIDC

### Files changed

- [x] `ui/app/api/admin-login/route.ts` — deleted
- [x] `ui/app/admin-login/page.tsx` — deleted
- [x] `pnpm add next-auth@beta` — installed (v5.0.0-beta.30)
- [x] `ui/auth.ts` — created (Auth.js v5 config)
- [x] `ui/app/api/auth/[...nextauth]/route.ts` — created
- [x] `ui/middleware.ts` — replaced with Auth.js session check
- [x] `ui/app/(admin)/layout.tsx` — shows logged-in user + sign-out
- [x] `ui/lib/api.ts` — fetchJSON adds `Authorization: Bearer` via getSession()

### Verification

- [ ] Browser: `/dashboard` (unauthenticated) → redirects to QuantumID
- [ ] Browser: `/dashboard` (authenticated) → renders dashboard
- [ ] Browser: logout → session cleared, redirected
- [ ] Page refresh (authenticated) → session persists, no re-login
- [ ] Admin layout shows logged-in user name/email

### Issues

_None yet._

---

## Phase 3 — K8s: Secrets Update

### Files changed

- [x] `infra/k8s/scraperagent/api/secret.yaml` — QuantumID vars added
- [x] `infra/k8s/scraperagent/ui/secret.yaml` — ADMIN_PASSWORD replaced with OIDC vars

### Verification

- [ ] K8s pods restart without errors with new env vars

### Issues

_None yet._

---

## Issues Log

| # | Phase | Description | Status | Resolution |
| --- | --- | --- | --- | --- |
| — | — | No issues logged yet | — | — |

---

## Decisions Made

| Decision | Reason | Date |
| --- | --- | --- |
| — | — | — |

---

## Notes

_Add any observations, edge cases discovered, or deviations from the GOTCHA plan here._
