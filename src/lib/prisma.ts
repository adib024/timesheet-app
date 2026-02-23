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

/**
 * Retry wrapper for database operations.
 * Handles Supabase cold starts and transient connection failures on Vercel serverless.
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
            const errorMsg = error instanceof Error ? error.message : String(error)
            const isConnectionError =
                errorMsg.includes('connection') ||
                errorMsg.includes('timeout') ||
                errorMsg.includes('ECONNREFUSED') ||
                errorMsg.includes('ECONNRESET') ||
                errorMsg.includes('P1001') || // Prisma: Can't reach database
                errorMsg.includes('P1002') || // Prisma: Database timed out
                errorMsg.includes('P1008') || // Prisma: Operations timed out
                errorMsg.includes('P1017')    // Prisma: Server closed connection

            if (isLastAttempt || !isConnectionError) throw error
            console.warn(`DB query failed (attempt ${attempt + 1}/${retries + 1}): ${errorMsg}. Retrying in ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
        }
    }
    throw new Error('Unreachable')
}

