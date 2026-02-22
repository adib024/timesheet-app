import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

// GET /api/categories - List all categories (public reference data)
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        })

        return NextResponse.json<ApiResponse<typeof categories>>({
            success: true,
            data: categories,
        })
    } catch (error) {
        console.error('GET /api/categories error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
