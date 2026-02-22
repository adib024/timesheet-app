'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Navigation/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { format } from 'date-fns'
import { formatAuditAction } from '@/lib/audit-client'

interface AuditLog {
    id: string
    action: string
    entityType: string
    entityId: string
    oldValue: Record<string, unknown> | null
    newValue: Record<string, unknown> | null
    createdAt: string
    user: {
        name: string | null
        email: string | null
    }
}

export default function AdminAuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch('/api/audit-logs')
                const json = await res.json()
                setLogs(json.data || [])
            } catch (error) {
                console.error('Failed to fetch audit logs:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLogs()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div>
            <Header title="Audit Log" />

            <div className="p-8">
                <Card>
                    <CardHeader
                        title="Recent Activity"
                        description="Administrative actions and changes"
                    />

                    {logs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No audit logs yet</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 flex-shrink-0">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {log.action === 'CREATE' && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            )}
                                            {log.action === 'UPDATE' && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            )}
                                            {log.action === 'DELETE' && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            )}
                                            {(log.action === 'ROLE_CHANGE' || log.action === 'BUDGET_CHANGE' || log.action === 'STATUS_CHANGE') && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            )}
                                            {(log.action === 'ASSIGN' || log.action === 'UNASSIGN') && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            )}
                                        </svg>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900">
                                            <span className="font-medium">{log.user.name || log.user.email}</span>
                                            {' '}
                                            {formatAuditAction(log.action, log.entityType)}
                                        </p>

                                        {log.newValue && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {Object.entries(log.newValue).map(([key, value]) => (
                                                    <span key={key} className="mr-3">
                                                        <span className="text-gray-500">{key}:</span>{' '}
                                                        <span className="font-medium">{String(value)}</span>
                                                    </span>
                                                )).slice(0, 3)}
                                            </p>
                                        )}

                                        <p className="text-xs text-gray-400 mt-1">
                                            {format(new Date(log.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
