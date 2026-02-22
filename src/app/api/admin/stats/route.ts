import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Get users on leave today
        const today = new Date()
        const leaves = await prisma.leaveDay.findMany({
            where: {
                date: {
                    gte: startOfDay(today),
                    lte: endOfDay(today),
                }
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        })

        // Get all time entries (excluding deleted)
        // We'll aggregate in memory to be flexible with the breakdown
        const entries = await prisma.timesheet.findMany({
            where: { isDeleted: false },
            include: {
                project: { select: { id: true, name: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        })

        // 1. Breakdown by Project -> Users
        const projectStats = new Map<string, {
            id: string
            name: string
            totalHours: number
            users: Map<string, { id: string, name: string | null, email: string | null, hours: number }>
        }>()

        for (const entry of entries) {
            if (!entry.project) continue // Skip entries without project (e.g. internal categories if any)

            const projectId = entry.project.id
            if (!projectStats.has(projectId)) {
                projectStats.set(projectId, {
                    id: projectId,
                    name: entry.project.name,
                    totalHours: 0,
                    users: new Map()
                })
            }

            const proj = projectStats.get(projectId)!
            const hours = entry.hours + (entry.minutes / 60)
            proj.totalHours += hours

            const userId = entry.userId
            if (!proj.users.has(userId)) {
                proj.users.set(userId, {
                    id: userId,
                    name: entry.user.name,
                    email: entry.user.email,
                    hours: 0
                })
            }

            const userStat = proj.users.get(userId)!
            userStat.hours += hours
        }

        // 2. Breakdown by User -> Projects
        const userStats = new Map<string, {
            id: string
            name: string | null
            email: string | null
            totalHours: number
            projects: Map<string, { id: string, name: string, hours: number }>
        }>()

        for (const entry of entries) {
            const userId = entry.userId
            if (!userStats.has(userId)) {
                userStats.set(userId, {
                    id: userId,
                    name: entry.user.name,
                    email: entry.user.email,
                    totalHours: 0,
                    projects: new Map()
                })
            }

            const user = userStats.get(userId)!
            const hours = entry.hours + (entry.minutes / 60)
            user.totalHours += hours

            if (entry.project) {
                const projectId = entry.project.id
                if (!user.projects.has(projectId)) {
                    user.projects.set(projectId, {
                        id: projectId,
                        name: entry.project.name,
                        hours: 0
                    })
                }
                const projStat = user.projects.get(projectId)!
                projStat.hours += hours
            }
        }

        // Convert Maps to Arrays for JSON response
        const projectBreakdown = Array.from(projectStats.values()).map(p => ({
            ...p,
            users: Array.from(p.users.values()).sort((a, b) => b.hours - a.hours)
        })).sort((a, b) => b.totalHours - a.totalHours)

        const userBreakdown = Array.from(userStats.values()).map(u => ({
            ...u,
            projects: Array.from(u.projects.values()).sort((a, b) => b.hours - a.hours)
        })).sort((a, b) => b.totalHours - a.totalHours)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                projectBreakdown,
                userBreakdown,
                usersOnLeave: leaves.map(l => ({
                    userId: l.userId,
                    name: l.user.name,
                    email: l.user.email,
                    type: l.type
                }))
            }
        })

    } catch (error) {
        console.error('GET /api/admin/stats error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
