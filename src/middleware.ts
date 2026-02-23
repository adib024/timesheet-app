import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req
    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
    const isPublicRoute = ["/login", "/api/test", "/demo"].some(route => nextUrl.pathname.startsWith(route))
    const isAdminRoute = nextUrl.pathname.startsWith("/admin")
    const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")

    if (isApiAuthRoute) return NextResponse.next()

    if (isPublicRoute) {
        if (isLoggedIn) {
            const role = req.auth?.user?.role
            return NextResponse.redirect(new URL(role === 'ADMIN' ? '/admin' : '/dashboard', nextUrl))
        }
        return NextResponse.next()
    }

    if (!isLoggedIn && (isAdminRoute || isDashboardRoute)) {
        return NextResponse.redirect(new URL("/login", nextUrl))
    }

    if (isLoggedIn && isAdminRoute && req.auth?.user?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }

    return NextResponse.next()
})

// Match all routes except static files
export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
