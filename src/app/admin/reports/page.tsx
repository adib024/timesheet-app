'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Navigation/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { getBudgetStatus, calculateBudgetPercentage } from '@/lib/utils'

interface ReportData {
    summary: {
        totalHours: number
        billableHours: number
        internalHours: number
        projectBreakdown: { projectId: string; projectName: string; hours: number }[]
        userBreakdown: { userId: string; userName: string; hours: number }[]
    }
    entries: Array<{
        id: string
        date: string
        hours: number
        minutes: number
        notes: string | null
        user: { name: string | null; email: string | null }
        project: { name: string; color: string; totalHours: number; usedHours: number } | null
        category: { name: string; color: string } | null
    }>
}

export default function AdminReportsPage() {
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchReport = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`)
            const json = await res.json()
            setReportData(json.data)
        } catch (error) {
            console.error('Failed to fetch report:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportCSV = () => {
        window.open(`/api/reports?startDate=${startDate}&endDate=${endDate}&export=csv`, '_blank')
    }

    const setQuickRange = (range: 'week' | 'month' | 'lastMonth') => {
        const today = new Date()
        if (range === 'week') {
            setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'))
            setEndDate(format(today, 'yyyy-MM-dd'))
        } else if (range === 'month') {
            setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
            setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
        } else if (range === 'lastMonth') {
            const lastMonth = subDays(startOfMonth(today), 1)
            setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
            setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
        }
    }

    useEffect(() => {
        fetchReport()
    }, [startDate, endDate])

    return (
        <div>
            <Header title="Reports" />

            <div className="p-8 space-y-6">
                {/* Filters */}
                <Card>
                    <div className="flex flex-wrap items-end gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-40"
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-40"
                        />
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setQuickRange('week')}>
                                Last 7 Days
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setQuickRange('month')}>
                                This Month
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setQuickRange('lastMonth')}>
                                Last Month
                            </Button>
                        </div>
                        <div className="ml-auto">
                            <Button variant="secondary" onClick={handleExportCSV}>
                                📥 Export CSV
                            </Button>
                        </div>
                    </div>
                </Card>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                    </div>
                ) : reportData ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <p className="text-sm text-gray-500">Total Hours</p>
                                <p className="text-3xl font-bold text-gray-900">{reportData.summary.totalHours.toFixed(1)}h</p>
                            </Card>
                        </div>

                        {/* Breakdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader title="By Project" />
                                <div className="space-y-3">
                                    {reportData.summary.projectBreakdown.map((p) => (
                                        <div key={p.projectId} className="flex items-center justify-between">
                                            <span className="text-gray-700">{p.projectName}</span>
                                            <span className="font-medium">{p.hours.toFixed(1)}h</span>
                                        </div>
                                    ))}
                                    {reportData.summary.projectBreakdown.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No project hours logged</p>
                                    )}
                                </div>
                            </Card>

                            <Card>
                                <CardHeader title="By User" />
                                <div className="space-y-3">
                                    {reportData.summary.userBreakdown.map((u) => (
                                        <div key={u.userId} className="flex items-center justify-between">
                                            <span className="text-gray-700">{u.userName}</span>
                                            <span className="font-medium">{u.hours.toFixed(1)}h</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Entries Table */}
                        <Card>
                            <CardHeader title="All Entries" description={`${reportData.entries.length} entries`} />
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Project/Category</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.entries.slice(0, 50).map((entry) => (
                                            <tr key={entry.id} className="border-b border-gray-100">
                                                <td className="py-3 px-4 text-gray-600">
                                                    {format(new Date(entry.date), 'MMM d, yyyy')}
                                                </td>
                                                <td className="py-3 px-4 text-gray-900">
                                                    {entry.user.name || entry.user.email}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center gap-2">
                                                        {entry.project?.name || entry.category?.name}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-medium">
                                                    {((entry.hours * 60 + entry.minutes) / 60).toFixed(1)}h
                                                </td>
                                                <td className="py-3 px-4 text-gray-500 truncate max-w-xs">
                                                    {entry.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {reportData.entries.length > 50 && (
                                    <p className="text-center text-gray-500 py-4">
                                        Showing first 50 entries. Export CSV for full data.
                                    </p>
                                )}
                            </div>
                        </Card>
                    </>
                ) : null}
            </div>
        </div>
    )
}
