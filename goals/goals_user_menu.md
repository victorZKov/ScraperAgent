# User Menu — ATLAS Workflow

## Goal

Replace the flat inline user controls in the admin header (ThemeToggle + name + sign-out link) with a proper **user dropdown menu**. The menu consolidates: user identity, theme switcher, and conditional Settings access based on admin role.

---

## A — Architect

### App Brief

- **Problem:** The current header puts ThemeToggle, user name, and sign-out as flat inline elements. Settings is always visible in the main nav regardless of who is logged in. As the app grows (more user types), this won't scale.
- **User:** Authenticated admin users of the system.
- **Success:** The header has a compact user avatar/name button that opens a dropdown containing: user identity info, theme switcher, Settings link (admin only), and sign-out.
- **Constraints:**
  - Must work with the existing Auth.js v5 session (server-side in layout, client-side in the dropdown)
  - ThemeToggle already exists as a standalone component — reuse its logic inside the dropdown
  - Admin detection must be declarative and configurable without code changes (env var whitelist)
  - No new dependencies — use only existing stack (Tailwind, next-themes, next-auth/react)

---

## T — Trace

### Data Schema

No DB changes. Admin status is determined at render time from:

1. `session.user.email` (from Auth.js session) compared against `ADMIN_EMAILS` env var
2. Optionally: `session.user.role` claim forwarded from the QuantumID OIDC token

### Admin Detection Strategy

Two-layer approach (either satisfies admin):

```
isAdmin = email in ADMIN_EMAILS env var
       OR token role claim is "admin" | "TenantAdmin" | "owner"
```

`ADMIN_EMAILS` is a comma-separated list set in the UI K8s secret. For this project: `victorxata@icloud.com`.

### Session data flow

```
QuantumID ID token → Auth.js jwt callback → JWT session cookie
  claims: name, email, role (if provided)

Auth.js session callback → session object
  session.user.name    ← from token
  session.user.email   ← from token
  session.user.role    ← from token.role (new, forwarded via callback)
  session.access_token ← already forwarded
```

---

## L — Link

### Connection Validation Checklist

```
[ ] session.user.name and session.user.email available in layout.tsx after auth()
[ ] isAdmin correctly identifies victorxata@icloud.com
[ ] Dropdown opens/closes on button click
[ ] Dropdown closes on outside click
[ ] Theme switches work inside dropdown (same as ThemeToggle)
[ ] Settings link only appears for admin users
[ ] Settings link disappears for non-admin users (test by removing email from ADMIN_EMAILS)
[ ] Sign-out from dropdown clears session and redirects to /api/auth/signin
[ ] Non-admin user: Settings not in dropdown, but /settings URL still protected by middleware (401 from API, not accessible from header)
```

---

## A — Assemble

### Header — before vs after

**Before:**
```
[Logo]   [Dashboard] [Settings]   [ThemeToggle] | [● name  Sign out]
```

**After:**
```
[Logo]   [Dashboard]                             [avatar name ▾]
                                                   ↓ dropdown:
                                                   ┌──────────────────┐
                                                   │ Victor Zaragoza  │
                                                   │ victorxata@...   │
                                                   ├──────────────────┤
                                                   │ Theme            │
                                                   │ [☀] [⬜] [☾]    │
                                                   ├──────────────────┤ ← admin only
                                                   │ ⚙ Settings       │ ← admin only
                                                   ├──────────────────┤
                                                   │ Sign out         │
                                                   └──────────────────┘
```

### Changes per file

| File | Change |
| --- | --- |
| `ui/auth.ts` | Forward `role` claim: `jwt` callback reads `profile?.role`, `session` callback copies to `session.user.role` |
| `ui/components/UserMenu.tsx` | **New file** — `'use client'` dropdown component. Props: `name`, `email`, `isAdmin`. Contains theme switcher + conditional Settings link + sign-out. |
| `ui/app/(admin)/layout.tsx` | Remove `ThemeToggle` import and inline user section. Remove Settings from main nav. Pass `user` data + `isAdmin` to `<UserMenu>`. |
| `ui/lib/types.ts` or `ui/types/next-auth.d.ts` | Extend `Session` type to include `user.role` |
| `infra/k8s/scraperagent/ui/secret.yaml` | Add `ADMIN_EMAILS` placeholder |

---

## S — Stress-test

### Functional Testing

```
[ ] Admin user: dropdown shows Settings link
[ ] Non-admin user: dropdown does NOT show Settings link
[ ] Theme light/system/dark: each button applies the correct theme
[ ] User name shown in trigger button (or email if no name)
[ ] User initials generated correctly for avatar (first letter of each word)
[ ] Dropdown closes when clicking outside
[ ] Dropdown closes when navigating (clicking a link inside it)
[ ] Sign-out redirects to /api/auth/signin and clears session
[ ] No hydration errors (ThemeToggle mounts after hydration)
```

### Edge Cases

```
[ ] User with no name (only email): avatar shows first letter of email local part
[ ] Very long name: truncates in dropdown header
[ ] No ADMIN_EMAILS env var set: no user is admin (Settings hidden from all)
[ ] Email not in ADMIN_EMAILS: Settings not visible
```

---

## Anti-Patterns to Avoid

1. **Checking admin in middleware** — admin check is only for UI display; route access control already handled by Auth.js middleware + API `RequireAuthorization()`
2. **Making UserMenu a server component** — it uses `useState` (open/close) and `useTheme` — must be `'use client'`
3. **Using `signOut` from `next-auth` server import in a client component** — import `signOut` from `next-auth/react` in client components
4. **Fetching session in the client dropdown** — session data (name, email, isAdmin) passed as props from the server layout; no client-side session fetching needed

---

## Related Files

- `ui/app/(admin)/layout.tsx` — header host
- `ui/components/ThemeToggle.tsx` — existing toggle logic to port into UserMenu
- `ui/auth.ts` — session callbacks
- `infra/k8s/scraperagent/ui/secret.yaml` — ADMIN_EMAILS
