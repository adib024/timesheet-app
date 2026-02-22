import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateProjectSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import type { ApiResponse } from '@/types'

// GET /api/projects/[id] - Get project details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const project = await prisma.project.findUnique({
            where: { id, isDeleted: false },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true },
                        },
                    },
                },
                timesheets: {
                    where: { isDeleted: false },
                    orderBy: { date: 'desc' },
                    take: 50,
                    include: {
                        user: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        })

        if (!project) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Project not found' }, { status: 404 })
        }

        // Non-admins can only view assigned projects
        if (session.user.role !== 'ADMIN') {
            const isAssigned = project.assignments.some(a => a.user.id === session.user.id)
            if (!isAssigned) {
                return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
            }
        }

        return NextResponse.json<ApiResponse<typeof project>>({
            success: true,
            data: project,
        })
    } catch (error) {
        console.error('GET /api/projects/[id] error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/projects/[id] - Update project (admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const validation = updateProjectSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const existingProject = await prisma.project.findUnique({
            where: { id, isDeleted: false },
        })

        if (!existingProject) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Project not found' }, { status: 404 })
        }

        const updatedProject = await prisma.project.update({
            where: { id },
            data: validation.data,
        })

        // Audit log for budget changes
        if (validation.data.totalHours !== undefined && validation.data.totalHours !== existingProject.totalHours) {
            await createAuditLog({
                userId: session.user.id,
                action: 'BUDGET_CHANGE',
                entityType: 'Project',
                entityId: id,
                oldValue: { totalHours: existingProject.totalHours },
                newValue: { totalHours: validation.data.totalHours },
            })
        }

        // Audit log for status changes
        if (validation.data.status && validation.data.status !== existingProject.status) {
            await createAuditLog({
                userId: session.user.id,
                action: validation.data.status === 'ARCHIVED' ? 'ARCHIVE' : 'RESTORE',
                entityType: 'Project',
                entityId: id,
                oldValue: { status: existingProject.status },
                newValue: { status: validation.data.status },
            })
        }

        return NextResponse.json<ApiResponse<typeof updatedProject>>({
            success: true,
            data: updatedProject,
            message: 'Project updated successfully',
        })
    } catch (error) {
        console.error('PATCH /api/projects/[id] error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/projects/[id] - Soft delete project (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params

        const project = await prisma.project.findUnique({
            where: { id, isDeleted: false },
        })

        if (!project) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Project not found' }, { status: 404 })
        }

        // Soft delete
        await prisma.project.update({
            where: { id },
            data: { isDeleted: true },
        })

        await createAuditLog({
            userId: session.user.id,
            action: 'DELETE',
            entityType: 'Project',
            entityId: id,
            oldValue: { name: project.name },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Project deleted successfully',
        })
    } catch (error) {
        console.error('DELETE /api/projects/[id] error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
