import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasourceUrl: process.env.DATABASE_URL
            ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}connect_timeout=15&pool_timeout=15&connection_limit=5`
            : undefined,
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Check if an error is a transient connection error worth retrying
function isConnectionError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error)
    return (
        msg.includes('connection') ||
        msg.includes('timeout') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ECONNRESET') ||
        msg.includes('P1001') ||
        msg.includes('P1002') ||
        msg.includes('P1008') ||
        msg.includes('P1017')
    )
}

/**
 * Extended Prisma client with auto-retry on ALL queries.
 * Used by PrismaAdapter in auth.ts so that OAuth callbacks
 * (user lookup, account creation) survive Supabase cold starts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prismaForAuth = prisma.$extends({
    query: {
        $allOperations: async ({ args, query }: { args: unknown; query: (args: unknown) => Promise<unknown> }) => {
            const maxRetries = 2
            const delayMs = 1500
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await query(args)
                } catch (error) {
                    if (attempt < maxRetries && isConnectionError(error)) {
                        console.warn(`[PrismaAdapter] DB query failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms...`)
                        await new Promise(resolve => setTimeout(resolve, delayMs))
                        continue
                    }
                    throw error
                }
            }
        },
    },
})

/**
 * Retry wrapper for database operations in API routes.
 * Usage: const users = await withDbRetry(() => prisma.user.findMany())
 */
export async function withDbRetry<T>(
    fn: () => Promise<T>,
    retries = 2,
    delayMs = 1500
): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (error: unknown) {
            const isLastAttempt = attempt === retries
            if (isLastAttempt || !isConnectionError(error)) throw error
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.warn(`DB query failed (attempt ${attempt + 1}/${retries + 1}): ${errorMsg}. Retrying in ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
        }
    }
    throw new Error('Unreachable')
}


