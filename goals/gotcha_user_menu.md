# GOTCHA: User Dropdown Menu in Admin Header

> AI execution instructions derived from `goals_user_menu.md` (ATLAS).
> Work through G → O → T → C → H → A in order. Do not skip phases.

---

## G — Goals

What this task must achieve when complete:

1. The admin header has a compact **UserMenu** dropdown (avatar + name + chevron) instead of the current flat inline controls.
2. The dropdown contains: user name + email, theme switcher (light/system/dark), Settings link (**admin only**), and Sign out.
3. Admin status is determined by comparing `session.user.email` against the `ADMIN_EMAILS` env var (comma-separated). No DB, no QuantumID role call.
4. The `role` claim from QuantumID is forwarded to the session as a bonus (future use), but admin gate today uses only `ADMIN_EMAILS`.
5. Settings is removed from the main header nav links — it lives only in the dropdown.

---

## O — Orchestration

Build in this exact order.

### Phase 1 — Forward `role` claim through Auth.js session

**File: `ui/auth.ts`**

Update both callbacks to forward the `role` claim from the OIDC ID token:

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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPath = ["/dashboard", "/settings", "/reports"].some(
        (p) => nextUrl.pathname.startsWith(p)
      );
      if (isAdminPath) return isLoggedIn;
      return true;
    },
    jwt({ token, account, profile }) {
      if (account) {
        token.access_token = account.access_token;
        token.role = (profile as any)?.role ?? null;
      }
      return token;
    },
    session({ session, token }) {
      (session as any).access_token = token.access_token;
      (session as any).user.role = token.role ?? null;
      return session;
    },
  },
});
```

---

### Phase 2 — Create `UserMenu` client component

**New file: `ui/components/UserMenu.tsx`**

Full implementation — copy this exactly:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface UserMenuProps {
  name: string | null | undefined;
  email: string | null | undefined;
  isAdmin: boolean;
}

export function UserMenu({ name, email, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = name ?? email ?? 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated/60 transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium text-text-primary hidden sm:block max-w-[120px] truncate">
          {displayName}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-text-faint transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border-subtle bg-surface shadow-xl shadow-black/10 z-50 overflow-hidden">
          {/* Identity */}
          <div className="px-3 py-2.5 border-b border-border-subtle/60">
            <p className="text-sm font-medium text-text-primary truncate">{name ?? email}</p>
            {name && email && (
              <p className="text-xs text-text-faint truncate mt-0.5">{email}</p>
            )}
          </div>

          {/* Theme */}
          <div className="px-3 py-2.5 border-b border-border-subtle/60">
            <p className="text-xs font-medium text-text-faint mb-2">Theme</p>
            {mounted ? (
              <div className="flex items-center rounded-lg border border-border-subtle bg-surface-sunken p-0.5 gap-0.5">
                <button
                  onClick={() => setTheme('light')}
                  title="Light"
                  className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${
                    theme === 'light'
                      ? 'bg-surface text-text-primary shadow-sm border border-border-subtle'
                      : 'text-text-faint hover:text-text-secondary border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  title="System"
                  className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${
                    theme === 'system'
                      ? 'bg-surface text-text-primary shadow-sm border border-border-subtle'
                      : 'text-text-faint hover:text-text-secondary border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  title="Dark"
                  className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${
                    theme === 'dark'
                      ? 'bg-surface text-text-primary shadow-sm border border-border-subtle'
                      : 'text-text-faint hover:text-text-secondary border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-8 rounded-lg border border-border-subtle bg-surface-sunken" />
            )}
          </div>

          {/* Settings — admin only */}
          {isAdmin && (
            <div className="py-1 border-b border-border-subtle/60">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated/60 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </div>
          )}

          {/* Sign out */}
          <div className="py-1">
            <button
              onClick={() => signOut({ callbackUrl: '/api/auth/signin' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated/60 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Phase 3 — Update admin layout

**File: `ui/app/(admin)/layout.tsx`**

Replace the entire file with the following. Key changes:
- Import `UserMenu` (not `ThemeToggle`, not `signOut`)
- Compute `isAdmin` from `ADMIN_EMAILS` env var
- Remove Settings from main nav
- Replace inline user section with `<UserMenu>`

```typescript
import Link from 'next/link';
import { auth } from '@/auth';
import { UserMenu } from '../../components/UserMenu';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes((user?.email ?? '').toLowerCase());

  return (
    <>
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border-subtle/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <svg
                  className="w-4.5 h-4.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                Scraper<span className="text-gradient">Agent</span>
              </span>
            </Link>

            {/* Right side: nav + user menu */}
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated/60 transition-all"
              >
                Dashboard
              </Link>
              <div className="w-px h-5 bg-border-subtle mx-1" />
              <UserMenu
                name={user?.name}
                email={user?.email}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle/40 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-xs text-text-faint">
            <span>
              &copy; 2026{' '}
              <a href="https://kovimatic.ie" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">
                Kovimatic
              </a>
            </span>
            <a href="mailto:it@kovimatic.ie" className="hover:text-text-secondary transition-colors">
              it@kovimatic.ie
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
```

---

### Phase 4 — Add ADMIN_EMAILS to K8s secret template

**File: `infra/k8s/scraperagent/ui/secret.yaml`**

Add one line to `stringData`:

```yaml
ADMIN_EMAILS: "<COMMA_SEPARATED_ADMIN_EMAILS>"
```

Apply the real value directly to the cluster (do NOT commit real emails):

```bash
kubectl get secret scraperagent-ui-secrets -n scraperagent -o json \
  | python3 -c "
import sys, json, base64
s = json.load(sys.stdin)
s['data']['ADMIN_EMAILS'] = base64.b64encode(b'victorxata@icloud.com').decode()
print(json.dumps(s))" \
  | kubectl apply -f -
```

Then restart the UI pod to pick up the new env var:

```bash
kubectl rollout restart deployment/scraperagent-ui -n scraperagent
kubectl rollout status deployment/scraperagent-ui -n scraperagent --timeout=120s
```

---

## T — Tools

| Task | Tool |
| --- | --- |
| Session data | `auth()` from `@/auth` (server component) |
| Theme state | `useTheme()` from `next-themes` (client component) |
| Client sign-out | `signOut` from `next-auth/react` |
| Outside click handler | `useRef` + `addEventListener('mousedown', ...)` |
| Admin check | `process.env.ADMIN_EMAILS` (server-side string comparison) |

---

## C — Context

### Why `'use client'` on UserMenu

The dropdown uses `useState` (open/close) and `useTheme` (theme state), both of which are hooks — they cannot run in a server component. The layout passes user data as plain props so no client-side session fetching is needed.

### Why `signOut` from `next-auth/react` (not `@/auth`)

In server components (`layout.tsx`), `signOut` from `@/auth` works via a Server Action. In client components (`UserMenu.tsx`), the import must come from `next-auth/react`. These are different exports with different runtime contexts.

### Why `ADMIN_EMAILS` and not the `role` claim

QuantumID role claims depend on tenant configuration that hasn't been set up. The email whitelist is simpler, auditable, and works immediately. The `role` claim is also forwarded to the session (via the `jwt` callback change in Phase 1) for future use.

### `settings` route stays protected in middleware

Even if Settings is not visible in the dropdown for non-admin users, navigating directly to `/settings` is still protected by:
1. `middleware.ts`: redirects to login if not authenticated
2. API: all config endpoints return 401 without a valid token

Settings is a UI convenience gate, not a security gate.

### ADMIN_EMAILS env var is server-side only

`ADMIN_EMAILS` does NOT need a `NEXT_PUBLIC_` prefix — it is only read by the server component (`layout.tsx`). The client (`UserMenu`) receives `isAdmin` as a computed boolean prop.

---

## H — Heuristics

1. **Never put `isAdmin` logic in the client component** — compute it server-side in `layout.tsx` and pass as prop.
2. **Handle hydration for theme buttons** — render a placeholder `<div>` until `mounted` is true to avoid hydration mismatch.
3. **`signOut` callbackUrl must be `/api/auth/signin`** — not `/login` or `/`, to match the Auth.js route.
4. **Truncate long names** — use `max-w-[120px] truncate` on the trigger button name; use `truncate` in the dropdown header.
5. **Close dropdown on link click** — call `setOpen(false)` in the Settings `Link`'s `onClick` handler.

---

## A — Args

### Concrete values

| Key | Value |
| --- | --- |
| Admin emails (initial) | `victorxata@icloud.com` |
| K8s secret key | `ADMIN_EMAILS` |
| Sign-out redirect | `/api/auth/signin` |
| Dropdown z-index | `z-50` |
| Avatar gradient | `from-blue-500 to-purple-600` (matches logo) |

### Acceptance criteria

```
[ ] /settings URL is not visible in main nav links
[ ] Clicking user button opens dropdown
[ ] Clicking outside closes dropdown
[ ] Theme buttons in dropdown switch theme correctly
[ ] victorxata@icloud.com → isAdmin=true → Settings visible in dropdown
[ ] Any other email → isAdmin=false → Settings NOT visible in dropdown
[ ] Sign out from dropdown clears session + redirects to /api/auth/signin
[ ] No TypeScript errors (tsc --noEmit passes)
[ ] pnpm build succeeds with no errors
```
