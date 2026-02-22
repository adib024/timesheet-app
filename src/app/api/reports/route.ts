import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reportFiltersSchema } from '@/lib/validations'
import { format } from 'date-fns'
import type { ApiResponse } from '@/types'

// GET /api/reports - Generate reports (admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const params = {
            startDate: searchParams.get('startDate') || '',
            endDate: searchParams.get('endDate') || '',
            userId: searchParams.get('userId') || undefined,
            projectId: searchParams.get('projectId') || undefined,
            categoryId: searchParams.get('categoryId') || undefined,
        }

        const validation = reportFiltersSchema.safeParse(params)
        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const { startDate, endDate, userId, projectId, categoryId } = validation.data

        const where: Record<string, unknown> = {
            isDeleted: false,
            date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        }

        if (userId) where.userId = userId
        if (projectId) where.projectId = projectId
        if (categoryId) where.categoryId = categoryId

        // Fetch entries
        const entries = await prisma.timesheet.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
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
            orderBy: [{ date: 'desc' }, { user: { name: 'asc' } }],
        })

        // Calculate summaries
        let totalMinutes = 0
        let billableMinutes = 0
        let internalMinutes = 0
        const projectTotals = new Map<string, { name: string; minutes: number }>()
        const userTotals = new Map<string, { name: string; minutes: number }>()

        for (const entry of entries) {
            const mins = entry.hours * 60 + entry.minutes
            totalMinutes += mins

            if (entry.projectId && entry.project) {
                billableMinutes += mins
                const existing = projectTotals.get(entry.projectId) || { name: entry.project.name, minutes: 0 }
                existing.minutes += mins
                projectTotals.set(entry.projectId, existing)
            } else {
                internalMinutes += mins
            }

            const userName = entry.user.name || entry.user.email || 'Unknown'
            const userExisting = userTotals.get(entry.userId) || { name: userName, minutes: 0 }
            userExisting.minutes += mins
            userTotals.set(entry.userId, userExisting)
        }

        const report = {
            filters: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                userId,
                projectId,
                categoryId,
            },
            summary: {
                totalHours: totalMinutes / 60,
                billableHours: billableMinutes / 60,
                internalHours: internalMinutes / 60,
                projectBreakdown: Array.from(projectTotals.entries()).map(([id, data]) => ({
                    projectId: id,
                    projectName: data.name,
                    hours: data.minutes / 60,
                })).sort((a, b) => b.hours - a.hours),
                userBreakdown: Array.from(userTotals.entries()).map(([id, data]) => ({
                    userId: id,
                    userName: data.name,
                    hours: data.minutes / 60,
                })).sort((a, b) => b.hours - a.hours),
            },
            entries,
        }

        // Check if CSV export requested
        const exportFormat = searchParams.get('export')
        if (exportFormat === 'csv') {
            const csvRows = [
                ['Date', 'User', 'Project/Category', 'Hours', 'Minutes', 'Total Hours', 'Notes'].join(','),
                ...entries.map(e => [
                    format(e.date, 'yyyy-MM-dd'),
                    `"${e.user.name || e.user.email || ''}"`,
                    `"${e.project?.name || e.category?.name || ''}"`,
                    e.hours,
                    e.minutes,
                    ((e.hours * 60 + e.minutes) / 60).toFixed(2),
                    `"${(e.notes || '').replace(/"/g, '""')}"`,
                ].join(','))
            ].join('\n')

            return new NextResponse(csvRows, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="timesheet-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
                },
            })
        }

        return NextResponse.json<ApiResponse<typeof report>>({
            success: true,
            data: report,
        })
    } catch (error) {
        console.error('GET /api/reports error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
