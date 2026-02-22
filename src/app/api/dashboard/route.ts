import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfWeek, format } from 'date-fns'
import type { ApiResponse } from '@/types'

// GET /api/dashboard - Get dashboard data for current user
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const today = new Date()
        const weekStart = startOfWeek(today, { weekStartsOn: 1 })

        // Get workday target from settings
        const workdaySetting = await prisma.settings.findUnique({
            where: { key: 'workday_hours' },
        })
        const targetHours = parseFloat(workdaySetting?.value || '7.5')

        // Today's entries
        const todayEntries = await prisma.timesheet.findMany({
            where: {
                userId: session.user.id,
                isDeleted: false,
                date: {
                    gte: startOfDay(today),
                    lte: endOfDay(today),
                },
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        totalHours: true,
                        usedHours: true
                    }
                },
                category: { select: { id: true, name: true, color: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        const todayMinutes = todayEntries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0)

        // This week's entries (grouped by day)
        const weekEntries = await prisma.timesheet.findMany({
            where: {
                userId: session.user.id,
                isDeleted: false,
                date: {
                    gte: weekStart,
                    lte: endOfDay(today),
                },
            },
            select: {
                date: true,
                hours: true,
                minutes: true,
            },
        })

        const weeklyByDay = new Map<string, number>()
        for (const entry of weekEntries) {
            const dateKey = format(entry.date, 'yyyy-MM-dd')
            const current = weeklyByDay.get(dateKey) || 0
            weeklyByDay.set(dateKey, current + entry.hours * 60 + entry.minutes)
        }

        const weekTotal = Array.from(weeklyByDay.values()).reduce((sum, mins) => sum + mins, 0)

        // Check if today is leave
        const isLeaveToday = await prisma.leaveDay.findUnique({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: startOfDay(today),
                },
            },
        })

        // Get assigned projects with budget info
        const assignments = await prisma.assignment.findMany({
            where: { userId: session.user.id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        totalHours: true,
                        usedHours: true,
                        status: true,
                    },
                },
            },
        })

        const projects = assignments
            .filter(a => a.project.status === 'ACTIVE')
            .map(a => ({
                ...a.project,
                remainingHours: Math.max(0, a.project.totalHours - a.project.usedHours),
                percentageUsed: a.project.totalHours > 0
                    ? Math.round((a.project.usedHours / a.project.totalHours) * 100)
                    : 0,
            }))

        // Get favorites
        const favorites = await prisma.favoriteProject.findMany({
            where: { userId: session.user.id },
            select: { projectId: true },
        })
        const favoriteIds = new Set(favorites.map(f => f.projectId))

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                today: {
                    date: today,
                    entries: todayEntries,
                    totalMinutes: todayMinutes,
                    targetMinutes: targetHours * 60,
                    isComplete: todayMinutes >= targetHours * 60,
                    isLeave: !!isLeaveToday,
                },
                week: {
                    startDate: weekStart,
                    totalMinutes: weekTotal,
                    targetMinutes: targetHours * 60 * 5, // 5 working days
                    dailyBreakdown: Object.fromEntries(weeklyByDay),
                },
                projects: projects.map(p => ({
                    ...p,
                    isFavorite: favoriteIds.has(p.id),
                })),
                targetHoursPerDay: targetHours,
            },
        })
    } catch (error) {
        console.error('GET /api/dashboard error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
