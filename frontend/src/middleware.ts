import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Protect all admin and student paths
  const isProtectedPath = pathname.startsWith('/admin') || pathname.startsWith('/student');

  if (!token && isProtectedPath) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (token) {
    // Only redirect /login to dashboard — landing page '/' is always accessible
    if (pathname === '/login') {
      if (userRole === 'ADMIN') {
        url.pathname = '/admin';
      } else {
        url.pathname = '/student';
      }
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files with extensions (e.g. .jpg, .png, .css)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
