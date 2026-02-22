import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assignmentSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import type { ApiResponse } from '@/types'

// POST /api/assignments - Assign user to project (admin only)
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
        const validation = assignmentSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const { userId, projectId } = validation.data

        // Check if already assigned
        const existing = await prisma.assignment.findUnique({
            where: {
                userId_projectId: { userId, projectId },
            },
        })

        if (existing) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'User is already assigned to this project'
            }, { status: 400 })
        }

        const assignment = await prisma.assignment.create({
            data: { userId, projectId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
            },
        })

        await createAuditLog({
            userId: session.user.id,
            action: 'ASSIGN',
            entityType: 'Assignment',
            entityId: assignment.id,
            newValue: { userId, projectId, projectName: assignment.project.name, userName: assignment.user.name },
        })

        return NextResponse.json<ApiResponse<typeof assignment>>({
            success: true,
            data: assignment,
            message: 'User assigned to project successfully',
        }, { status: 201 })
    } catch (error) {
        console.error('POST /api/assignments error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/assignments - Remove assignment (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const projectId = searchParams.get('projectId')

        if (!userId || !projectId) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'userId and projectId are required'
            }, { status: 400 })
        }

        const assignment = await prisma.assignment.findUnique({
            where: {
                userId_projectId: { userId, projectId },
            },
            include: {
                user: { select: { name: true } },
                project: { select: { name: true } },
            },
        })

        if (!assignment) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Assignment not found' }, { status: 404 })
        }

        await prisma.assignment.delete({
            where: {
                userId_projectId: { userId, projectId },
            },
        })

        await createAuditLog({
            userId: session.user.id,
            action: 'UNASSIGN',
            entityType: 'Assignment',
            entityId: assignment.id,
            oldValue: { userId, projectId, projectName: assignment.project.name, userName: assignment.user.name },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Assignment removed successfully',
        })
    } catch (error) {
        console.error('DELETE /api/assignments error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
