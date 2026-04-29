import { NextResponse } from 'next/server';

function resolveHomePath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/student';
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/favicon.svg', request.url));
  }

  const token = request.cookies.get('sms_token')?.value;
  const role = request.cookies.get('sms_role')?.value;

  const isAuthPage = pathname === '/login';
  const isProtectedPage =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/exams');

  if (!token && isProtectedPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPage && role) {
    return NextResponse.redirect(new URL(resolveHomePath(role), request.url));
  }

  if (token && role) {
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(resolveHomePath(role), request.url));
    }
    if (pathname.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL(resolveHomePath(role), request.url));
    }
    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL(resolveHomePath(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/favicon.ico', '/login', '/admin/:path*', '/teacher/:path*', '/student/:path*', '/notifications/:path*', '/profile/:path*', '/exams/:path*'],
};
