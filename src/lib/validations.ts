import { z } from 'zod'

// Timesheet entry validation
const timesheetBaseSchema = z.object({
    projectId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    hours: z.number().int().min(0).max(24),
    minutes: z.number().int().min(0).max(59),
    notes: z.string().max(500).optional().nullable(),
})

export const createTimesheetSchema = timesheetBaseSchema.refine((data) => data.projectId || data.categoryId, {
    message: 'Either project or category must be specified',
})

// For updates, don't require the project/category check at schema level (validated in API)
export const updateTimesheetSchema = z.object({
    projectId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    date: z.string().optional(),
    hours: z.number().int().min(0).max(24).optional(),
    minutes: z.number().int().min(0).max(59).optional(),
    notes: z.string().max(500).optional().nullable(),
})


export const createProjectSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    totalHours: z.number().min(0).optional(),
})

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    totalHours: z.number().min(0).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
})

// Assignment validation
export const assignmentSchema = z.object({
    userId: z.string().min(1),
    projectId: z.string().min(1),
})

// User validation
export const updateUserSchema = z.object({
    role: z.enum(['ADMIN', 'USER']).optional(),
    isActive: z.boolean().optional(),
})

// Leave day validation
export const leaveDaySchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    type: z.enum(['ANNUAL', 'SICK', 'HOLIDAY', 'OTHER']).optional(),
})

// Report filters validation
export const reportFiltersSchema = z.object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date',
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid end date',
    }),
    userId: z.string().optional(),
    projectId: z.string().optional(),
    categoryId: z.string().optional(),
})

// Settings validation
export const updateSettingsSchema = z.object({
    workday_hours: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    backdate_limit_days: z.string().regex(/^\d+$/).optional(),
    session_timeout_hours: z.string().regex(/^\d+$/).optional(),
    allowed_domains: z.string().min(1).optional(),
})

// Favorite project validation
export const favoriteProjectSchema = z.object({
    projectId: z.string().min(1),
})

// Type exports from schemas
export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AssignmentInput = z.infer<typeof assignmentSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LeaveDayInput = z.infer<typeof leaveDaySchema>
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
