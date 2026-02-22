import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTimesheetSchema } from '@/lib/validations'
import { isWithinBackdateLimit, roundToNearest15 } from '@/lib/utils'
import type { ApiResponse, TimesheetEntry } from '@/types'

// Simple in-memory rate limiting (per user, per minute)
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const limit = rateLimit.get(userId)

    if (!limit || now > limit.resetAt) {
        rateLimit.set(userId, { count: 1, resetAt: now + 60000 }) // 1 minute window
        return true
    }

    if (limit.count >= 10) { // Max 10 entries per minute
        return false
    }

    limit.count++
    return true
}

// GET /api/timesheets - List timesheet entries
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const userId = searchParams.get('userId')
        const projectId = searchParams.get('projectId')

        const isAdmin = session.user.role === 'ADMIN'

        const where: Record<string, unknown> = {
            isDeleted: false,
        }

        // Admin sees all entries unless filtering by a specific user
        // Regular users always see only their own entries
        if (isAdmin && userId) {
            where.userId = userId
        } else if (!isAdmin) {
            where.userId = session.user.id
        }

        if (startDate) {
            where.date = { ...((where.date as object) || {}), gte: new Date(startDate) }
        }
        if (endDate) {
            where.date = { ...((where.date as object) || {}), lte: new Date(endDate) }
        }
        if (projectId) {
            where.projectId = projectId
        }

        const timesheets = await prisma.timesheet.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        totalHours: true,
                        usedHours: true
                    },
                },
                category: {
                    select: { id: true, name: true, color: true },
                },
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        })

        return NextResponse.json<ApiResponse<TimesheetEntry[]>>({
            success: true,
            data: timesheets,
        })
    } catch (error) {
        console.error('GET /api/timesheets error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/timesheets - Create timesheet entry
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limiting
        if (!checkRateLimit(session.user.id)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'Too many requests. Please wait a moment.'
            }, { status: 429 })
        }

        const body = await request.json()
        const validation = createTimesheetSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const { projectId, categoryId, date, hours, minutes, notes } = validation.data
        const entryDate = new Date(date)

        // Check backdate limit
        const backdateLimit = parseInt(process.env.BACKDATE_LIMIT_DAYS || '7')
        if (!isWithinBackdateLimit(entryDate, backdateLimit)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: `Cannot log time for dates more than ${backdateLimit} days in the past`
            }, { status: 400 })
        }

        // Round minutes to nearest 15
        const roundedMinutes = roundToNearest15(minutes)

        // If project specified, verify assignment (non-admin)
        if (projectId && session.user.role !== 'ADMIN') {
            const assignment = await prisma.assignment.findUnique({
                where: {
                    userId_projectId: {
                        userId: session.user.id,
                        projectId,
                    },
                },
            })

            if (!assignment) {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: 'You are not assigned to this project'
                }, { status: 403 })
            }
        }

        // Create entry
        const timesheet = await prisma.timesheet.create({
            data: {
                userId: session.user.id,
                projectId: projectId || null,
                categoryId: categoryId || null,
                date: entryDate,
                hours,
                minutes: roundedMinutes,
                notes: notes || null,
            },
            include: {
                project: {
                    select: { id: true, name: true, color: true },
                },
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        })

        // Update project used hours
        if (projectId) {
            const totalMinutes = hours * 60 + roundedMinutes
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    usedHours: {
                        increment: totalMinutes / 60,
                    },
                },
            })
        }

        return NextResponse.json<ApiResponse<typeof timesheet>>({
            success: true,
            data: timesheet,
            message: 'Time entry created successfully',
        }, { status: 201 })
    } catch (error) {
        console.error('POST /api/timesheets error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
