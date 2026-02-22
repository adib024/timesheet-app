import { prisma } from './prisma'
import type { AuditAction, AuditEntityType } from '@/types'

interface AuditLogParams {
    userId: string
    action: AuditAction
    entityType: AuditEntityType
    entityId: string
    oldValue?: unknown
    newValue?: unknown
}

export async function createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
}: AuditLogParams) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
                newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
            },
        })
    } catch (error) {
        // Log error but don't fail the main operation
        console.error('Failed to create audit log:', error)
    }
}

// Helper to get recent audit logs
export async function getAuditLogs(options: {
    entityType?: AuditEntityType
    entityId?: string
    userId?: string
    limit?: number
    offset?: number
}) {
    const { entityType, entityId, userId, limit = 50, offset = 0 } = options

    return prisma.auditLog.findMany({
        where: {
            ...(entityType && { entityType }),
            ...(entityId && { entityId }),
            ...(userId && { userId }),
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
    })
}

// Format audit log for display
export function formatAuditAction(action: string, entityType: string): string {
    const actionMap: Record<string, string> = {
        CREATE: 'created',
        UPDATE: 'updated',
        DELETE: 'deleted',
        ARCHIVE: 'archived',
        RESTORE: 'restored',
        ASSIGN: 'assigned user to',
        UNASSIGN: 'removed user from',
        BUDGET_CHANGE: 'changed budget for',
        ROLE_CHANGE: 'changed role of',
    }

    return `${actionMap[action] || action} ${entityType.toLowerCase()}`
}
