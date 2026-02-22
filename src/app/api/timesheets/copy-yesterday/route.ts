import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import type { ApiResponse } from '@/types'

// POST /api/timesheets/copy-yesterday - Copy yesterday's entries to today
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const today = new Date()
        const yesterday = subDays(today, 1)

        // Get yesterday's entries
        const yesterdayEntries = await prisma.timesheet.findMany({
            where: {
                userId: session.user.id,
                isDeleted: false,
                date: {
                    gte: startOfDay(yesterday),
                    lte: endOfDay(yesterday),
                },
            },
        })

        if (yesterdayEntries.length === 0) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'No entries found for yesterday'
            }, { status: 404 })
        }

        // Check if today already has entries
        const todayEntries = await prisma.timesheet.findMany({
            where: {
                userId: session.user.id,
                isDeleted: false,
                date: {
                    gte: startOfDay(today),
                    lte: endOfDay(today),
                },
            },
        })

        if (todayEntries.length > 0) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'Today already has entries. Delete them first to copy.'
            }, { status: 400 })
        }

        // Copy entries to today (without notes)
        const newEntries = await prisma.$transaction(
            yesterdayEntries.map(entry =>
                prisma.timesheet.create({
                    data: {
                        userId: session.user.id,
                        projectId: entry.projectId,
                        categoryId: entry.categoryId,
                        date: startOfDay(today),
                        hours: entry.hours,
                        minutes: entry.minutes,
                        notes: null, // Clear notes for fresh entries
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
            )
        )

        // Update project hours
        for (const entry of newEntries) {
            if (entry.projectId) {
                const totalMinutes = entry.hours * 60 + entry.minutes
                await prisma.project.update({
                    where: { id: entry.projectId },
                    data: {
                        usedHours: {
                            increment: totalMinutes / 60,
                        },
                    },
                })
            }
        }

        return NextResponse.json<ApiResponse<typeof newEntries>>({
            success: true,
            data: newEntries,
            message: `Copied ${newEntries.length} entries from yesterday`,
        }, { status: 201 })
    } catch (error) {
        console.error('POST /api/timesheets/copy-yesterday error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
