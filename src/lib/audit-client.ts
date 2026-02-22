// Client-side audit utilities (no Prisma dependency)

export function formatAuditAction(action: string, entityType: string): string {
    const actions: Record<string, string> = {
        CREATE: `created a new ${entityType.toLowerCase()}`,
        UPDATE: `updated a ${entityType.toLowerCase()}`,
        DELETE: `deleted a ${entityType.toLowerCase()}`,
        ROLE_CHANGE: `changed a user's role`,
        BUDGET_CHANGE: `updated project budget`,
        STATUS_CHANGE: `changed project status`,
        ASSIGN: `assigned a user to a project`,
        UNASSIGN: `removed a user from a project`,
    }

    return actions[action] || `performed ${action} on ${entityType.toLowerCase()}`
}
