'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuickAddButtons } from '@/components/TimeEntry/QuickAddButtons'
import { ProjectBudgetCard } from '@/components/Dashboard/ProjectBudgetCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatTime, formatDate, getBudgetStatus, calculateBudgetPercentage, fromMinutes } from '@/lib/utils'

interface DashboardData {
    today: {
        entries: Array<{
            id: string
            hours: number
            minutes: number
            notes: string | null
            project?: { id: string; name: string; color: string; totalHours: number; usedHours: number } | null
            category?: { id: string; name: string; color: string } | null
        }>
        totalMinutes: number
        targetMinutes: number
        isLeave: boolean
    }
    projects: Array<{
        id: string
        name: string
        color: string
        totalHours: number
        usedHours: number
        remainingHours: number
        percentageUsed: number
        isFavorite: boolean
    }>
    targetHoursPerDay: number
}

interface Category {
    id: string
    name: string
    color: string
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const { hours: todayHours, minutes: todayMinutes } = data ? fromMinutes(data.today.totalMinutes) : { hours: 0, minutes: 0 }

    const fetchData = useCallback(async () => {
        try {
            const [dashboardRes, categoriesRes] = await Promise.all([
                fetch('/api/dashboard', { cache: 'no-store' }),
                fetch('/api/categories', { cache: 'no-store' }),
            ])

            if (!dashboardRes.ok || !categoriesRes.ok) {
                throw new Error('Failed to fetch data')
            }

            const dashboardJson = await dashboardRes.json()
            const categoriesJson = await categoriesRes.json()

            setData(dashboardJson.data)
            setCategories(categoriesJson.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAddTime = async (entryData: {
        projectId?: string
        categoryId?: string
        hours: number
        minutes: number
        notes?: string
    }) => {
        // Use local date instead of UTC to fix "added to yesterday" bug
        // "sv-SE" locale formats as YYYY-MM-DD which is what we want
        const today = new Date().toLocaleDateString('sv-SE')

        const res = await fetch('/api/timesheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...entryData,
                date: today,
            }),
        })

        if (!res.ok) {
            const json = await res.json()
            throw new Error(json.error || 'Failed to add time')
        }

        // Refresh data
        await fetchData()
    }

    const handleCopyYesterday = async () => {
        const res = await fetch('/api/timesheets/copy-yesterday', {
            method: 'POST',
        })

        if (!res.ok) {
            const json = await res.json()
            alert(json.error || 'Failed to copy entries')
            return
        }

        await fetchData()
    }

    const handleToggleFavorite = async (projectId: string) => {
        const project = data?.projects.find(p => p.id === projectId)
        if (!project) return

        if (project.isFavorite) {
            await fetch(`/api/favorites?projectId=${projectId}`, { method: 'DELETE' })
        } else {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
            })
        }

        await fetchData()
    }

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm('Delete this entry?')) return

        await fetch(`/api/timesheets/${entryId}`, { method: 'DELETE' })
        await fetchData()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
                    <Button onClick={fetchData}>Retry</Button>
                </div>
            </div>
        )
    }

    // Template A Dashboard Layout
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-brand-teal uppercase tracking-wide">Dashboard</h2>
                    <p className="text-gray-500 text-lg">Overview & Time Tracking</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">{formatDate(new Date())}</p>
                    <p className="text-brand-teal font-medium">Week {Math.ceil(new Date().getDate() / 7)}</p>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal hover:shadow-card-hover transition-all transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">
                        {formatTime(todayHours, todayMinutes, 'decimal').replace('h', '')}
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today's Hours</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal hover:shadow-card-hover transition-all transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">
                        {data.projects.length}
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Projects</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal hover:shadow-card-hover transition-all transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">
                        {Math.min(100, Math.round((data.today.totalMinutes / data.today.targetMinutes) * 100))}%
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Daily Target</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal hover:shadow-card-hover transition-all transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">
                        {data.today.entries.length}
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Time Entries</div>
                </div>
            </div>

            {/* Quick Time Entry (Preserving Logic) */}
            {/* Quick Time Entry Removed per user request */}

            {/* Metrics & Projects Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Recent Activity (Modified from Metrics) */}
                <div className="space-y-8">
                    <div className="bg-white rounded-2xl shadow-card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-700 uppercase">Recent Entries</h3>
                        </div>

                        <div className="space-y-4">
                            {data.today.entries.length === 0 ? (
                                <p className="text-gray-400 text-center py-4 italic">No time logged today</p>
                            ) : (
                                data.today.entries.map((entry) => (
                                    <div key={entry.id} className="group p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">
                                                    {entry.project?.name || entry.category?.name}
                                                </p>
                                                {entry.notes && (
                                                    <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-2xl text-brand-teal block">
                                                    {formatTime(entry.hours, entry.minutes)}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                    className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Projects List (Wide) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl shadow-card p-8">
                        <h3 className="text-2xl font-bold text-brand-teal mb-8 border-b pb-4">ACTIVE PROJECTS</h3>

                        <div className="space-y-6">
                            {data.projects.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-xl text-gray-400 font-medium">No active projects found</p>
                                    <p className="text-gray-500 mt-2">Contact your admin to get assigned.</p>
                                </div>
                            ) : (
                                data.projects.map((project) => (
                                    <div key={project.id} className="p-6 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-brand-teal">{project.name}</h4>
                                                <p className="text-gray-500">Internal Project</p>
                                            </div>
                                            <div className={`px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${project.percentageUsed >= 100 ? 'bg-red-100 text-brand-pink' :
                                                project.percentageUsed >= 80 ? 'bg-yellow-100 text-brand-yellow' :
                                                    'bg-teal-50 text-brand-teal'
                                                }`}>
                                                <span>{project.percentageUsed >= 100 ? '⚠ Over Budget' :
                                                    project.percentageUsed >= 80 ? '⏱ At Risk' :
                                                        '✓ On Track'}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${project.percentageUsed >= 100 ? 'bg-brand-pink' :
                                                        project.percentageUsed >= 80 ? 'bg-brand-yellow' :
                                                            'bg-brand-teal'
                                                        }`}
                                                    style={{ width: `${Math.min(100, project.percentageUsed)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xl font-bold min-w-[3.5rem] text-right ${project.percentageUsed >= 100 ? 'text-brand-pink' :
                                                project.percentageUsed >= 80 ? 'text-brand-yellow' :
                                                    'text-brand-teal'
                                                }`}>
                                                {project.percentageUsed}%
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
