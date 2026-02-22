import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUserSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import type { ApiResponse, UserInfo } from '@/types'

// GET /api/users - List all users (admin only)
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        })

        return NextResponse.json<ApiResponse<UserInfo[]>>({
            success: true,
            data: users,
        })
    } catch (error) {
        console.error('GET /api/users error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/users - Update user (admin only)
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { userId, ...updateData } = body

        if (!userId) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'User ID required' }, { status: 400 })
        }

        const validation = updateUserSchema.safeParse(updateData)
        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        // Prevent self-demotion
        if (userId === session.user.id && validation.data.role === 'USER') {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'Cannot demote yourself'
            }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!existingUser) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: validation.data,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        })

        // Audit log
        if (validation.data.role && validation.data.role !== existingUser.role) {
            await createAuditLog({
                userId: session.user.id,
                action: 'ROLE_CHANGE',
                entityType: 'User',
                entityId: userId,
                oldValue: { role: existingUser.role },
                newValue: { role: validation.data.role },
            })
        }

        return NextResponse.json<ApiResponse<typeof updatedUser>>({
            success: true,
            data: updatedUser,
            message: 'User updated successfully',
        })
    } catch (error) {
        console.error('PATCH /api/users error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
