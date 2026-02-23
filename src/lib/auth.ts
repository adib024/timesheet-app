import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma, prismaForAuth } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'loveimagefoundry.com').split(',').map(d => d.trim())
const IS_DEMO_MODE = process.env.DEMO_MODE === 'true'

// Admin emails that always get ADMIN role, even if DB is unreachable (cold start safety net)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'anshul@loveimagefoundry.com,aditya@aigeniq.ai').split(',').map(e => e.trim().toLowerCase())

// Helper: retry a DB operation with delay (handles Supabase cold starts)
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            if (attempt === retries) throw error
            console.warn(`DB operation failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
        }
    }
    throw new Error('Unreachable')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    // PrismaAdapter handles user/account creation on Google sign-in
    // Uses prismaForAuth which has auto-retry on all queries for cold start resilience
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(IS_DEMO_MODE ? {} : { adapter: PrismaAdapter(prismaForAuth as any) }),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || 'demo',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo',
            allowDangerousEmailAccountLinking: true,
            checks: ['state'], // Bypass PKCE to fix 'Invalid code verifier'
        }),
        // Demo mode credentials provider
        ...(IS_DEMO_MODE ? [
            Credentials({
                name: 'Demo',
                credentials: {
                    email: { label: 'Email', type: 'email' },
                    role: { label: 'Role', type: 'text' },
                },
                async authorize(credentials) {
                    const email = credentials?.email as string
                    const role = (credentials?.role as string) || 'USER'

                    if (!email) return null

                    // Find or create demo user
                    let user = await prisma.user.findUnique({ where: { email } })

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email,
                                name: email.split('@')[0],
                                role: role === 'ADMIN' ? 'ADMIN' : 'USER',
                                isActive: true,
                            },
                        })
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    }
                },
            }),
        ] : []),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Demo mode bypasses domain check
            if (IS_DEMO_MODE && account?.provider === 'credentials') {
                return true
            }

            // Domain restriction for Google auth
            const email = user.email
            if (!email) return false

            const domain = email.split('@')[1]
            if (!ALLOWED_DOMAINS.includes(domain)) {
                return false
            }

            return true
        },
        async jwt({ token, user, account }) {
            // On initial sign-in, fetch role from database
            if (user) {
                // For demo mode, the user object already has role
                if (IS_DEMO_MODE) {
                    token.role = (user as { role?: string }).role || 'USER'
                    token.isActive = (user as { isActive?: boolean }).isActive ?? true
                    token.userId = user.id
                } else {
                    // For Google OAuth, look up the user in the database to get their role
                    // Uses retry logic to handle Supabase cold starts
                    const email = (user.email || token.email || '') as string
                    try {
                        if (email) {
                            const dbUser = await withRetry(() =>
                                prisma.user.findUnique({ where: { email } })
                            )
                            token.role = dbUser?.role || (ADMIN_EMAILS.includes(email.toLowerCase()) ? 'ADMIN' : 'USER')
                            token.isActive = dbUser?.isActive ?? true
                            token.userId = dbUser?.id || user.id
                        } else {
                            token.role = 'USER'
                            token.isActive = true
                            token.userId = user.id
                        }
                    } catch (error) {
                        console.error('Error fetching user from database during JWT callback (all retries failed):', error)
                        // Fallback: use admin email list to determine role even if DB is down
                        token.role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'ADMIN' : 'USER'
                        token.isActive = true
                        token.userId = user.id
                    }
                }
                token.name = user.name || (user.email ? user.email.split('@')[0] : 'User')
            }
            return token
        },
        async session({ session, token }) {
            // Build session from JWT token data
            if (session.user && token) {
                session.user.id = (token.userId as string) || token.sub || ''
                session.user.role = (token.role as UserRole) || 'USER'
                session.user.isActive = (token.isActive as boolean) ?? true
                session.user.name = (token.name as string) || 'User'
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        // Always use JWT — works in both demo and production on Vercel serverless
        strategy: 'jwt',
        maxAge: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24') * 60 * 60,
    },
})
