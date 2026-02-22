import { UserRole, ProjectStatus, LeaveType } from '@prisma/client'

// Extend NextAuth types
declare module 'next-auth' {
    interface User {
        role?: UserRole
        isActive?: boolean
    }

    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: UserRole
            isActive: boolean
        }
    }
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

// Timesheet entry with relations
export interface TimesheetEntry {
    id: string
    userId: string
    projectId: string | null
    categoryId: string | null
    date: Date
    hours: number
    minutes: number
    notes: string | null
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
    project?: {
        id: string
        name: string
        color: string
    } | null
    category?: {
        id: string
        name: string
        color: string
    } | null
}

// Project with budget info
export interface ProjectWithBudget {
    id: string
    name: string
    color: string
    totalHours: number
    usedHours: number
    status: ProjectStatus
    remainingHours: number
    percentageUsed: number
    assignedUsers?: {
        id: string
        name: string | null
        email: string | null
    }[]
}

// User info for admin views
export interface UserInfo {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: UserRole
    isActive: boolean
    createdAt: Date
    totalHoursThisWeek?: number
}

// Daily summary
export interface DailySummary {
    date: Date
    totalHours: number
    totalMinutes: number
    entries: TimesheetEntry[]
    target: number // from settings
    isLeaveDay: boolean
}

// Weekly summary
export interface WeeklySummary {
    weekStart: Date
    weekEnd: Date
    days: DailySummary[]
    totalHours: number
    totalMinutes: number
    targetHours: number
}

// Report filters
export interface ReportFilters {
    startDate: Date
    endDate: Date
    userId?: string
    projectId?: string
    categoryId?: string
}

// Report data
export interface ReportData {
    filters: ReportFilters
    summary: {
        totalHours: number
        billableHours: number
        internalHours: number
        projectBreakdown: {
            projectId: string
            projectName: string
            hours: number
        }[]
        userBreakdown: {
            userId: string
            userName: string
            hours: number
        }[]
    }
    entries: TimesheetEntry[]
}

// Audit log types
export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'ARCHIVE'
    | 'RESTORE'
    | 'ASSIGN'
    | 'UNASSIGN'
    | 'BUDGET_CHANGE'
    | 'ROLE_CHANGE'

export type AuditEntityType =
    | 'Project'
    | 'User'
    | 'Assignment'
    | 'Timesheet'
    | 'Settings'

export interface AuditLogEntry {
    id: string
    userId: string
    action: AuditAction
    entityType: AuditEntityType
    entityId: string
    oldValue: unknown
    newValue: unknown
    createdAt: Date
    user?: {
        name: string | null
        email: string | null
    }
}

export { UserRole, ProjectStatus, LeaveType }
