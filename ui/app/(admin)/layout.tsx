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
