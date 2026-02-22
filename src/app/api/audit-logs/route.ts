import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAuditLogs } from '@/lib/audit'
import type { ApiResponse } from '@/types'

// GET /api/audit-logs - Get audit logs (admin only)
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const logs = await getAuditLogs({ limit: 100 })

        return NextResponse.json<ApiResponse<typeof logs>>({
            success: true,
            data: logs,
        })
    } catch (error) {
        console.error('GET /api/audit-logs error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
