import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { leaveDaySchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

// GET /api/leave - Get user's leave days
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build where clause
        const where: any = {}
        const isAdmin = session.user.role === 'ADMIN'
        const userId = searchParams.get('userId')

        if (!isAdmin) {
            where.userId = session.user.id
        } else if (userId) {
            where.userId = userId
        }

        if (startDate) {
            where.date = { ...where.date, gte: new Date(`${startDate}T00:00:00Z`) }
        }
        if (endDate) {
            where.date = { ...where.date, lte: new Date(`${endDate}T23:59:59.999Z`) }
        }

        const leaveDays = await prisma.leaveDay.findMany({
            where,
            orderBy: { date: 'desc' },
            include: isAdmin ? {
                user: { select: { id: true, name: true, email: true } },
            } : undefined,
        })

        return NextResponse.json<ApiResponse<typeof leaveDays>>({
            success: true,
            data: leaveDays,
        })
    } catch (error) {
        console.error('GET /api/leave error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/leave - Mark day as leave
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validation = leaveDaySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const { date, type } = validation.data
        const notes = body.notes || null

        // Store as Noon UTC to ensure it stays in the day regardless of minor shifts
        const leaveDate = new Date(`${date}T12:00:00Z`)

        // Standard Prisma Create
        // Relies on DB UNIQUE constraint for duplicates
        try {
            const leaveDay = await prisma.leaveDay.create({
                data: {
                    userId: session.user.id,
                    date: leaveDate,
                    type: type || 'OTHER',
                    notes,
                },
            });

            return NextResponse.json<ApiResponse<typeof leaveDay>>({
                success: true,
                data: leaveDay,
                message: 'Leave day added',
            }, { status: 201 })
        } catch (error: any) {
            // Handle unique constraint violation (code P2002)
            if (error.code === 'P2002') {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: 'This day is already marked as leave'
                }, { status: 400 })
            }
            throw error; // Re-throw other errors
        }

    } catch (error: any) {
        console.error('POST /api/leave error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/leave - Remove leave marking
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')

        if (!date) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'date is required' }, { status: 400 })
        }

        // Match date range covering the day
        const start = new Date(`${date}T00:00:00Z`)
        const end = new Date(`${date}T23:59:59.999Z`)

        // Standard Prisma Delete
        const result = await prisma.leaveDay.deleteMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: start,
                    lte: end,
                },
            },
        })

        if (result.count === 0) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'No leave day found for this date'
            }, { status: 404 })
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Leave day removed',
        })
    } catch (error) {
        console.error('DELETE /api/leave error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
