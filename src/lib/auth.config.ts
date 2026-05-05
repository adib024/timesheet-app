import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
// Core config that is Edge-compatible (no Prisma imports)

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'loveimagefoundry.com,loveimagefoundry.co.uk,thepixelworkshop.com').split(',').map(d => d.trim())
const IS_DEMO_MODE = process.env.DEMO_MODE === 'true'

export const authConfig = {
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || 'demo',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo',
            allowDangerousEmailAccountLinking: true,
            checks: ['state'],
        }),
        ...(IS_DEMO_MODE ? [
            Credentials({
                name: 'Demo',
                credentials: {
                    email: { label: 'Email', type: 'email' },
                    role: { label: 'Role', type: 'text' },
                },
                // authorize logic will be in auth.ts since it needs Prisma
                async authorize() {
                    return null
                },
            }),
        ] : []),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (IS_DEMO_MODE && account?.provider === 'credentials') return true
            const email = user.email
            if (!email) return false
            const domain = email.split('@')[1]
            return ALLOWED_DOMAINS.includes(domain)
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role || 'USER'
                token.userId = user.id
                token.isActive = (user as any).isActive ?? true
                token.name = user.name || (user.email ? user.email.split('@')[0] : 'User')
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = (token.userId as string) || token.sub || ''
                session.user.role = (token.role as any) || 'USER'
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
        strategy: 'jwt',
        maxAge: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24') * 60 * 60,
    },
} satisfies NextAuthConfig
