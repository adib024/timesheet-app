import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma, prismaForAuth } from '@/lib/prisma'
import { authConfig } from './auth.config'
import Credentials from 'next-auth/providers/credentials'

const IS_DEMO_MODE = process.env.DEMO_MODE === 'true'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'anshul@loveimagefoundry.com,aditya@aigeniq.ai,noreply@loveimagefoundry.co.uk').split(',').map(e => e.trim().toLowerCase())

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
    ...authConfig,
    // Use prismaForAuth (with built-in retry) for the adapter.
    // middleware.ts uses auth.config.ts which doesn't have an adapter,
    // so this won't impact middleware bundle size.
    adapter: IS_DEMO_MODE ? undefined : PrismaAdapter(prismaForAuth as any),
    providers: [
        ...authConfig.providers.filter(p => (p as any).id !== 'credentials'),
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
                    return { id: user.id, email: user.email, name: user.name, role: user.role }
                },
            }),
        ] : []),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, account }) {
            if (user) {
                if (IS_DEMO_MODE) {
                    token.role = (user as any).role || 'USER'
                    token.isActive = (user as any).isActive ?? true
                    token.userId = user.id
                } else {
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
                        console.error('Error fetching user from database during JWT callback:', error)
                        token.role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'ADMIN' : 'USER'
                        token.isActive = true
                        token.userId = user.id
                    }
                }
                token.name = user.name || (user.email ? user.email.split('@')[0] : 'User')
            }
            return token
        },
    }
})

