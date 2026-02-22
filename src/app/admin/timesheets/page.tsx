'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { format } from 'date-fns'

interface TimesheetEntry {
    id: string
    date: string
    hours: number
    minutes: number
    notes: string | null
    project: { name: string, color: string } | null
    category: { name: string, color: string } | null
    user: { name: string | null, email: string | null } | null
}

export default function AdminTimesheetsPage() {
    const [entries, setEntries] = useState<TimesheetEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Fetch last 30 days by default (or just fetch all if volume is low)
        // For now, fetch all from API (API returns user's if User, All if Admin)
        const fetchData = async () => {
            try {
                const res = await fetch('/api/timesheets')
                const json = await res.json()
                if (json.success) {
                    setEntries(json.data)
                }
            } catch (error) {
                console.error('Failed to fetch timesheets', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return <div className="p-8">Loading timesheets...</div>
    }

    return (
        <div className="space-y-6 animate-fade-in font-barlow">
            <h1 className="text-4xl font-bold text-brand-teal mb-8">Review Timesheets</h1>

            <div className="p-8 space-y-6">
                <Card>
                    <CardHeader title="Recent Entries" description="All timesheet submissions across the organization" />

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Project / Category</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Duration</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map(entry => (
                                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-900 font-medium">
                                            {format(new Date(entry.date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{entry.user?.name || 'Unknown'}</span>
                                                <span className="text-xs text-gray-500">{entry.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {entry.project ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                                                    style={{ backgroundColor: `${entry.project.color}20`, color: entry.project.color }}>
                                                    {entry.project.name}
                                                </span>
                                            ) : entry.category ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                    {entry.category.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-brand-teal">
                                            {entry.hours}h {entry.minutes > 0 ? `${entry.minutes}m` : ''}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-sm max-w-xs truncate">
                                            {entry.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">No timesheet entries found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
