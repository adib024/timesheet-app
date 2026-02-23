import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'loveimagefoundry.com').split(',').map(d => d.trim())
const IS_DEMO_MODE = process.env.DEMO_MODE === 'true'

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    // PrismaAdapter handles user/account creation on Google sign-in
    ...(IS_DEMO_MODE ? {} : { adapter: PrismaAdapter(prisma) }),
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
                    try {
                        const email = user.email || token.email
                        if (email) {
                            const dbUser = await prisma.user.findUnique({
                                where: { email },
                            })
                            token.role = dbUser?.role || 'USER'
                            token.isActive = dbUser?.isActive ?? true
                            token.userId = dbUser?.id || user.id
                        } else {
                            token.role = 'USER'
                            token.isActive = true
                            token.userId = user.id
                        }
                    } catch (error) {
                        console.error('Error fetching user from database during JWT callback:', error)
                        // Fail gracefully: assign default role
                        token.role = 'USER'
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
