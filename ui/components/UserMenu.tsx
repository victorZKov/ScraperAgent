'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface UserMenuProps {
  name: string | null | undefined;
  email: string | null | undefined;
  isAdmin: boolean;
  version?: string;
}

export function UserMenu({ name, email, isAdmin, version }: UserMenuProps) {
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
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
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
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated/60 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>

          {/* Version */}
          {version && (
            <div className="px-3 py-2 border-t border-border-subtle/60">
              <p className="text-xs font-mono text-text-faint">v{version}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
