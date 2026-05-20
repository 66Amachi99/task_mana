import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req });

  if (token && pathname === '/') {
    const lastPath = req.cookies.get('last_path')?.value || '/dashboard';
    return NextResponse.redirect(new URL(lastPath, req.url));
  }

  if (
    !token && 
    (pathname.startsWith('/dashboard') || pathname.startsWith('/calendar') || pathname.startsWith('/admin') || pathname.startsWith('/stats') || pathname.startsWith('/timeline'))
  ) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const response = NextResponse.next();

  if (token && pathname !== '/' && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    response.cookies.set('last_path', pathname, { 
      path: '/',
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/stats/:path*', '/calendar/:path*', '/admin/:path*', '/timeline/:path*'],
};
