import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PATHS = ['/dashboard', '/settings', '/reports'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isAdminPath) return NextResponse.next();

  const token = request.cookies.get('admin-token');
  if (token?.value === 'authenticated') return NextResponse.next();

  const loginUrl = new URL('/admin-login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/reports/:path*'],
};
