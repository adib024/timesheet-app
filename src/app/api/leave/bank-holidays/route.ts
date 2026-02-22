import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// UK Bank Holidays (England & Wales)
const UK_BANK_HOLIDAYS: Record<number, { date: string; name: string }[]> = {
    2025: [
        { date: '2025-01-01', name: 'New Year\'s Day' },
        { date: '2025-04-18', name: 'Good Friday' },
        { date: '2025-04-21', name: 'Easter Monday' },
        { date: '2025-05-05', name: 'Early May Bank Holiday' },
        { date: '2025-05-26', name: 'Spring Bank Holiday' },
        { date: '2025-08-25', name: 'Summer Bank Holiday' },
        { date: '2025-12-25', name: 'Christmas Day' },
        { date: '2025-12-26', name: 'Boxing Day' },
    ],
    2026: [
        { date: '2026-01-01', name: 'New Year\'s Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-05-04', name: 'Early May Bank Holiday' },
        { date: '2026-05-25', name: 'Spring Bank Holiday' },
        { date: '2026-08-31', name: 'Summer Bank Holiday' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-28', name: 'Boxing Day (substitute)' },
    ],
    2027: [
        { date: '2027-01-01', name: 'New Year\'s Day' },
        { date: '2027-03-26', name: 'Good Friday' },
        { date: '2027-03-29', name: 'Easter Monday' },
        { date: '2027-05-03', name: 'Early May Bank Holiday' },
        { date: '2027-05-31', name: 'Spring Bank Holiday' },
        { date: '2027-08-30', name: 'Summer Bank Holiday' },
        { date: '2027-12-27', name: 'Christmas Day (substitute)' },
        { date: '2027-12-28', name: 'Boxing Day (substitute)' },
    ],
}

// GET /api/leave/bank-holidays?year=2026
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

        const holidays = UK_BANK_HOLIDAYS[year] || []

        return NextResponse.json<ApiResponse<typeof holidays>>({
            success: true,
            data: holidays,
        })
    } catch (error) {
        console.error('GET /api/leave/bank-holidays error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
