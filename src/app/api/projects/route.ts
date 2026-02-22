import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProjectSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import { getRandomProjectColor } from '@/lib/utils'
import type { ApiResponse, ProjectWithBudget } from '@/types'

// GET /api/projects - List projects
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const includeArchived = searchParams.get('includeArchived') === 'true'
        const userId = session.user.id
        const isAdmin = session.user.role === 'ADMIN'

        let projects

        if (isAdmin) {
            // Admins see all projects
            projects = await prisma.project.findMany({
                where: {
                    isDeleted: false,
                    ...(includeArchived ? {} : { status: 'ACTIVE' }),
                },
                include: {
                    assignments: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            })
        } else {
            // Users only see assigned projects
            projects = await prisma.project.findMany({
                where: {
                    isDeleted: false,
                    status: 'ACTIVE',
                    assignments: {
                        some: { userId },
                    },
                },
                include: {
                    assignments: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            })
        }

        // Get user's favorite projects
        const favorites = await prisma.favoriteProject.findMany({
            where: { userId },
            select: { projectId: true },
        })
        const favoriteIds = new Set(favorites.map(f => f.projectId))

        // Transform to include calculated fields
        const projectsWithBudget: (ProjectWithBudget & { isFavorite: boolean })[] = projects.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            totalHours: p.totalHours,
            usedHours: p.usedHours,
            status: p.status,
            remainingHours: Math.max(0, p.totalHours - p.usedHours),
            percentageUsed: p.totalHours > 0 ? Math.round((p.usedHours / p.totalHours) * 100) : 0,
            assignedUsers: p.assignments.map(a => a.user),
            isFavorite: favoriteIds.has(p.id),
        }))

        // Sort favorites first
        projectsWithBudget.sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1
            if (!a.isFavorite && b.isFavorite) return 1
            return a.name.localeCompare(b.name)
        })

        return NextResponse.json<ApiResponse<typeof projectsWithBudget>>({
            success: true,
            data: projectsWithBudget,
        })
    } catch (error) {
        console.error('GET /api/projects error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/projects - Create project (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const validation = createProjectSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const { name, color, totalHours } = validation.data

        const project = await prisma.project.create({
            data: {
                name,
                color: color || getRandomProjectColor(),
                totalHours: totalHours || 0,
            },
        })

        // Audit log
        await createAuditLog({
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'Project',
            entityId: project.id,
            newValue: { name, totalHours },
        })

        return NextResponse.json<ApiResponse<typeof project>>({
            success: true,
            data: project,
            message: 'Project created successfully',
        }, { status: 201 })
    } catch (error) {
        console.error('POST /api/projects error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
