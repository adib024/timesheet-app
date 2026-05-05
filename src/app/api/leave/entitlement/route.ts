import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

// GET /api/leave/entitlement?userId=xxx&year=2026
// Returns entitlement info: base, extra, used, remaining
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const isAdmin = session.user.role === 'ADMIN'
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
        const requestedUserId = searchParams.get('userId')

        // Non-admins can only see their own entitlement
        const targetUserId = isAdmin && requestedUserId ? requestedUserId : session.user.id

        // Get or create entitlement for user+year
        let entitlement = await prisma.leaveEntitlement.findUnique({
            where: { userId_year: { userId: targetUserId, year } },
        })

        if (!entitlement) {
            // Auto-create default entitlement
            entitlement = await prisma.leaveEntitlement.create({
                data: {
                    userId: targetUserId,
                    year,
                    baseAllowance: 25,
                    extraAllowance: 0,
                },
            })
        }

        // Count used leave days for this year (exclude HOLIDAY type which is bank holidays)
        // Half days count as 0.5
        const yearStart = new Date(`${year}-01-01T00:00:00Z`)
        const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`)

        const leaveDays = await prisma.leaveDay.findMany({
            where: {
                userId: targetUserId,
                date: { gte: yearStart, lte: yearEnd },
                type: { not: 'HOLIDAY' },
            },
            select: { isHalfDay: true },
        })

        const usedDays = leaveDays.reduce((sum, ld) => sum + (ld.isHalfDay ? 0.5 : 1), 0)

        const totalAllowance = entitlement.baseAllowance + entitlement.extraAllowance
        const remaining = Math.max(0, totalAllowance - usedDays)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                userId: targetUserId,
                year,
                baseAllowance: entitlement.baseAllowance,
                extraAllowance: entitlement.extraAllowance,
                extraReason: entitlement.extraReason,
                totalAllowance,
                used: usedDays,
                remaining,
            },
        })
    } catch (error) {
        console.error('GET /api/leave/entitlement error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/leave/entitlement - Admin: allocate extra holidays
// Body: { userId, year, extraDays, reason }
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
        const { userId, year, extraDays, reason, baseAllowance } = body

        if (!userId || !year || extraDays === undefined) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'userId, year, and extraDays are required',
            }, { status: 400 })
        }

        if (typeof extraDays !== 'number' || extraDays < 0 || extraDays > 50) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'extraDays must be between 0 and 50',
            }, { status: 400 })
        }

        // Upsert entitlement
        const updateData: any = {
            extraAllowance: extraDays,
            extraReason: reason || null,
        }
        const createData: any = {
            userId,
            year,
            baseAllowance: typeof baseAllowance === 'number' ? baseAllowance : 25,
            extraAllowance: extraDays,
            extraReason: reason || null,
        }
        if (typeof baseAllowance === 'number' && baseAllowance >= 0 && baseAllowance <= 50) {
            updateData.baseAllowance = baseAllowance
        }
        const entitlement = await prisma.leaveEntitlement.upsert({
            where: { userId_year: { userId, year } },
            update: updateData,
            create: createData,
        })

        return NextResponse.json<ApiResponse<typeof entitlement>>({
            success: true,
            data: entitlement,
            message: `Allocated ${extraDays} extra days`,
        })
    } catch (error) {
        console.error('POST /api/leave/entitlement error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
