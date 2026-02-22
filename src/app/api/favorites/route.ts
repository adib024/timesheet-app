import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { favoriteProjectSchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

// GET /api/favorites - Get user's favorite projects
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const favorites = await prisma.favoriteProject.findMany({
            where: { userId: session.user.id },
            include: {
                project: {
                    select: { id: true, name: true, color: true, status: true },
                },
            },
        })

        return NextResponse.json<ApiResponse<typeof favorites>>({
            success: true,
            data: favorites,
        })
    } catch (error) {
        console.error('GET /api/favorites error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/favorites - Add project to favorites
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validation = favoriteProjectSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const { projectId } = validation.data

        // Check if already favorited
        const existing = await prisma.favoriteProject.findUnique({
            where: {
                userId_projectId: {
                    userId: session.user.id,
                    projectId,
                },
            },
        })

        if (existing) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'Project is already in favorites'
            }, { status: 400 })
        }

        const favorite = await prisma.favoriteProject.create({
            data: {
                userId: session.user.id,
                projectId,
            },
            include: {
                project: {
                    select: { id: true, name: true, color: true },
                },
            },
        })

        return NextResponse.json<ApiResponse<typeof favorite>>({
            success: true,
            data: favorite,
            message: 'Project added to favorites',
        }, { status: 201 })
    } catch (error) {
        console.error('POST /api/favorites error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/favorites - Remove project from favorites
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')

        if (!projectId) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'projectId is required' }, { status: 400 })
        }

        await prisma.favoriteProject.delete({
            where: {
                userId_projectId: {
                    userId: session.user.id,
                    projectId,
                },
            },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Project removed from favorites',
        })
    } catch (error) {
        console.error('DELETE /api/favorites error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
