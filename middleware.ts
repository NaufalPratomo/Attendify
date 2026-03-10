import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('attendify_token')?.value;
    const { pathname } = request.nextUrl;

    // Rute publik yang seharusnya redirect ke dashboard jika sudah login
    const isAuthRoute = pathname.startsWith('/auth');
    const isRootRoute = pathname === '/';

    if ((isRootRoute || isAuthRoute) && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Proteksi rute-rute aplikasi jika belum login
    const isProtectedRoute = [
        '/dashboard', '/logbook', '/holidays', '/profile', '/reports', '/setting', '/settings'
    ].some(route => pathname.startsWith(route));

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/auth/:path*',
        '/dashboard/:path*',
        '/logbook/:path*',
        '/holidays/:path*',
        '/profile/:path*',
        '/reports/:path*',
        '/setting/:path*',
        '/settings/:path*'
    ],
};
