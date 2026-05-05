'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { QuantumTimeInput } from '@/components/TimeEntry/QuantumTimeInput'
import { roundToNearest15, formatTime } from '@/lib/utils'

interface TimesheetEntry {
    id: string
    date: string
    hours: number
    minutes: number
    notes: string | null
    project: { id: string; name: string, color: string } | null
    category: { id: string; name: string, color: string } | null
    user: { name: string | null, email: string | null } | null
}

interface Project {
    id: string
    name: string
    color: string
}

const getDayName = (date: Date) => format(date, 'EEE').toUpperCase()
const formatDateShort = (date: Date) => format(date, 'MMM d')

export default function AdminTimesheetsPage() {
    const [entries, setEntries] = useState<TimesheetEntry[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form state for admin's own time entry
    const [showForm, setShowForm] = useState(false)
    const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [selectedProject, setSelectedProject] = useState('')
    const [taskNotes, setTaskNotes] = useState('')
    const [hoursInput, setHoursInput] = useState('7.5')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i))

    const fetchData = useCallback(async () => {
        try {
            const [entriesRes, projectsRes, categoriesRes] = await Promise.all([
                fetch('/api/timesheets'),
                fetch('/api/projects?includeArchived=false'),
                fetch('/api/categories'),
            ])
            const entriesJson = await entriesRes.json()
            const projectsJson = await projectsRes.json()
            const categoriesJson = await categoriesRes.json()

            if (entriesJson.success) setEntries(entriesJson.data)
            setProjects(projectsJson.data || [])
            setCategories(categoriesJson.data || [])
        } catch (error) {
            console.error('Failed to fetch timesheets', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAddEntry = async () => {
        if (!selectedProject || !hoursInput) return

        setIsSubmitting(true)
        const hours = parseFloat(hoursInput)
        const h = Math.floor(hours)
        const m = Math.round((hours - h) * 60)

        try {
            const res = await fetch('/api/timesheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    projectId: selectedProject.startsWith('project:') ? selectedProject.replace('project:', '') : undefined,
                    categoryId: selectedProject.startsWith('category:') ? selectedProject.replace('category:', '') : undefined,
                    hours: h,
                    minutes: roundToNearest15(m),
                    notes: taskNotes
                })
            })

            const json = await res.json()

            if (res.ok && json.success) {
                setTaskNotes('')
                await fetchData()
            } else {
                alert(json.error || 'Failed to add time entry')
            }
        } catch (error) {
            console.error('Add entry error:', error)
            alert('Failed to add time entry. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="p-8">Loading timesheets...</div>
    }

    return (
        <div className="space-y-6 animate-fade-in font-barlow">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-brand-teal">Review Timesheets</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Close' : '+ Log My Time'}
                </Button>
            </div>

            {/* Admin's Own Time Entry Form */}
            {showForm && (
                <Card className="border-l-4 border-l-brand-teal">
                    <CardHeader title="Log My Time" description="Select a day and add your time entry" />

                    {/* Week Day Selector */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <Button variant="ghost" onClick={() => setCurrentWeek(addDays(currentWeek, -7))}>← Prev Week</Button>
                            <span className="text-sm font-semibold text-gray-600">
                                {format(currentWeek, 'MMM d')} – {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                            </span>
                            <Button variant="ghost" onClick={() => setCurrentWeek(addDays(currentWeek, 7))}>Next Week →</Button>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {weekDays.map((day) => {
                                const dayStr = format(day, 'yyyy-MM-dd')
                                const isSelected = selectedDate === dayStr
                                // Compute day totals from ALL entries (not just admin's)
                                const myEntries = entries.filter(e => e.date.startsWith(dayStr))
                                const dayTotal = myEntries.reduce((sum, e) => sum + e.hours + e.minutes / 60, 0)

                                return (
                                    <button
                                        key={dayStr}
                                        onClick={() => setSelectedDate(dayStr)}
                                        className={`
                                            rounded-xl p-4 text-center cursor-pointer transition-all transform hover:-translate-y-1 shadow-md
                                            ${isSelected ? 'bg-brand-yellow text-white scale-105' : 'bg-brand-teal text-white hover:bg-opacity-90'}
                                        `}
                                    >
                                        <div className="text-sm font-semibold opacity-90">{getDayName(day)}</div>
                                        <div className="text-2xl font-bold my-1">{dayTotal.toFixed(1)}</div>
                                        <div className="text-xs opacity-80">{formatDateShort(day)}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Entry Form */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-gray-600 font-semibold mb-1 text-sm">Project / Category</label>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal text-sm appearance-none bg-white"
                            >
                                <option value="">Select...</option>
                                <optgroup label="Projects">
                                    {projects.map(p => (
                                        <option key={p.id} value={`project:${p.id}`}>{p.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Internal">
                                    {categories.map(c => (
                                        <option key={c.id} value={`category:${c.id}`}>{c.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold mb-1 text-sm">Notes</label>
                            <input
                                type="text"
                                placeholder="e.g. Design review"
                                value={taskNotes}
                                onChange={(e) => setTaskNotes(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold mb-1 text-sm">Hours</label>
                            <QuantumTimeInput
                                value={hoursInput}
                                onChange={setHoursInput}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleAddEntry}
                                disabled={isSubmitting || !selectedProject}
                                className="w-full bg-brand-teal hover:bg-opacity-90 text-white py-2 rounded-lg font-bold uppercase tracking-wider"
                            >
                                {isSubmitting ? 'Adding...' : 'Add Entry'}
                            </Button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                        Selected date: <strong className="text-brand-teal">{format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</strong>
                    </p>
                </Card>
            )}

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
