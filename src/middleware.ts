import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Ultra-lightweight middleware — zero external imports
// Only checks if auth cookie exists. Actual auth validation happens in API routes.
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public routes
    if (
        pathname === '/login' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/demo')
    ) {
        return NextResponse.next()
    }

    // Check for session cookie (NextAuth sets these)
    const hasSession =
        request.cookies.has('authjs.session-token') ||
        request.cookies.has('__Secure-authjs.session-token') ||
        request.cookies.has('next-auth.session-token') ||
        request.cookies.has('__Secure-next-auth.session-token')

    if (!hasSession) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
