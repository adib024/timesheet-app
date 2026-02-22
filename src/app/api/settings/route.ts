import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

// GET /api/settings - Get all system settings
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const settings = await prisma.settings.findMany()

        // Convert to key-value object
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        return NextResponse.json<ApiResponse<typeof settingsMap>>({
            success: true,
            data: settingsMap,
        })
    } catch (error) {
        console.error('GET /api/settings error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/settings - Update system settings
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const updates = Object.entries(body as Record<string, string>)

        // Transaction to update all settings
        await prisma.$transaction(
            updates.map(([key, value]) =>
                prisma.settings.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) },
                })
            )
        )

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Settings updated successfully',
        })
    } catch (error) {
        console.error('POST /api/settings error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
