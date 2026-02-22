'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { formatTime, roundToNearest15, getBudgetStatus, calculateBudgetPercentage } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { QuantumTimeInput } from '@/components/TimeEntry/QuantumTimeInput'

interface TimesheetEntry {
    id: string
    date: string
    hours: number
    minutes: number
    notes: string | null
    project?: { id: string; name: string; color: string; totalHours: number; usedHours: number } | null
    category?: { id: string; name: string; color: string } | null
}

interface Project {
    id: string
    name: string
    color: string
    isFavorite: boolean
}

// Helper to format date for day cards
const formatDateShort = (date: Date) => format(date, 'MMM d')
const getDayName = (date: Date) => format(date, 'EEE').toUpperCase()

export default function TimesheetPage() {
    const [entries, setEntries] = useState<TimesheetEntry[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([])
    const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [isLoading, setIsLoading] = useState(true)

    // Form State
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [selectedProject, setSelectedProject] = useState('')
    const [taskNotes, setTaskNotes] = useState('')
    const [hoursInput, setHoursInput] = useState('8.0')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchAllData = useCallback(async () => {
        const startDate = format(currentWeek, 'yyyy-MM-dd')
        const endDate = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')

        try {
            const [entriesRes, projectsRes, categoriesRes] = await Promise.all([
                fetch(`/api/timesheets?startDate=${startDate}&endDate=${endDate}`),
                fetch('/api/projects?includeArchived=false'),
                fetch('/api/categories')
            ])

            const entriesJson = await entriesRes.json()
            const projectsJson = await projectsRes.json()
            const categoriesJson = await categoriesRes.json()

            setEntries(entriesJson.data || [])
            setProjects(projectsJson.data || [])
            setCategories(categoriesJson.data || [])
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [currentWeek])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

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
                await fetchAllData()
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

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm('Delete this entry?')) return
        await fetch(`/api/timesheets/${entryId}`, { method: 'DELETE' })
        await fetchAllData()
    }

    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i)) // Mon-Fri for Template A
    const weekTotal = entries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0)
    const weekTotalHours = (weekTotal / 60).toFixed(1)
    const targetHours = 40
    const progressPercent = Math.min(100, (weekTotal / (targetHours * 60)) * 100)

    // Project breakdown for summary
    const projectBreakdown = entries.reduce((acc, entry) => {
        const name = entry.project?.name || entry.category?.name || 'Unknown'
        acc[name] = (acc[name] || 0) + (entry.hours + entry.minutes / 60)
        return acc
    }, {} as Record<string, number>)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in text-barlow">
            {/* Week Overview */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-teal uppercase tracking-wide">
                        Week of {format(currentWeek, 'MMMM d')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMMM d, yyyy')}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setCurrentWeek(addDays(currentWeek, -7))}>←</Button>
                        <Button variant="ghost" onClick={() => setCurrentWeek(addDays(currentWeek, 7))}>→</Button>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                    {weekDays.map((day) => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        const dayEntries = entries.filter(e => e.date.startsWith(dayStr))
                        const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours + e.minutes / 60, 0)
                        const isSelected = selectedDate === dayStr

                        return (
                            <div
                                key={dayStr}
                                onClick={() => setSelectedDate(dayStr)}
                                className={`
                                    rounded-xl p-5 text-center cursor-pointer transition-all transform hover:-translate-y-1 shadow-md
                                    ${isSelected ? 'bg-brand-yellow text-white' : 'bg-brand-teal text-white hover:bg-opacity-90'}
                                `}
                            >
                                <div className="text-sm font-semibold opacity-90">{getDayName(day)}</div>
                                <div className="text-3xl font-bold my-2">{dayTotal.toFixed(1)}</div>
                                <div className="text-xs opacity-80">{formatDateShort(day)}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Main Grid: Entry Form & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Entry Form */}
                <div className="bg-white rounded-2xl shadow-card p-8">
                    <h2 className="text-2xl font-bold text-brand-teal uppercase tracking-wide mb-6">Add Time Entry</h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-gray-600 font-semibold mb-2">Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={format(subDays(new Date(), 7), 'yyyy-MM-dd')}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal font-barlow text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 font-semibold mb-2">Project / Category</label>
                            <div className="relative">
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal font-barlow text-lg appearance-none bg-white"
                                >
                                    <option value="">Select Project...</option>
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
                        </div>

                        <div>
                            <label className="block text-gray-600 font-semibold mb-2">Task / Notes</label>
                            <input
                                type="text"
                                placeholder="e.g. Design mockups"
                                value={taskNotes}
                                onChange={(e) => setTaskNotes(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal font-barlow text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 font-semibold mb-2">Hours</label>
                            <QuantumTimeInput
                                value={hoursInput}
                                onChange={setHoursInput}
                                className="w-full"
                            />
                        </div>

                        <Button
                            onClick={handleAddEntry}
                            disabled={isSubmitting || !selectedProject}
                            className="w-full bg-brand-teal hover:bg-opacity-90 text-white text-xl py-4 rounded-lg font-bold uppercase tracking-wider"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Entry'}
                        </Button>
                    </div>
                </div>

                {/* Weekly Summary */}
                <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col h-full">
                    <h2 className="text-2xl font-bold text-brand-teal uppercase tracking-wide mb-6">Weekly Summary</h2>

                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <div className="text-lg font-semibold text-gray-600 mb-2">Total Hours This Week</div>
                        <div className="text-5xl font-bold text-brand-teal mb-4">{weekTotalHours}</div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-brand-yellow rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="text-sm text-gray-500">Target: {targetHours} hours</div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {Object.entries(projectBreakdown).map(([name, hours]) => (
                            <div key={name} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0">
                                <span className="text-gray-600 font-medium">{name}</span>
                                <span className="text-brand-teal font-bold text-lg">{hours.toFixed(1)} hrs</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Entries Table */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="p-6 bg-white border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-brand-teal uppercase tracking-wide m-0">Recent Entries</h2>
                </div>

                <div className="w-full">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-brand-teal text-white font-bold text-lg uppercase tracking-wider">
                        <div className="col-span-4">Project</div>
                        <div className="col-span-5">Task</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-1 text-right">Hours</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {entries.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 italic">No entries for this week</div>
                        ) : (
                            entries.map((entry) => (
                                <div key={entry.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center group">
                                    <div className="col-span-4 font-bold text-brand-teal text-lg truncate">
                                        {entry.project?.name || entry.category?.name}
                                    </div>
                                    <div className="col-span-5 text-gray-600 truncate">
                                        {entry.notes || '-'}
                                    </div>
                                    <div className="col-span-2 text-gray-800 font-medium">
                                        {format(parseISO(entry.date), 'MMM d')}
                                    </div>
                                    <div className="col-span-1 text-right font-bold text-brand-teal flex justify-end gap-3 items-center">
                                        {formatTime(entry.hours, entry.minutes)}
                                        <button
                                            onClick={() => handleDeleteEntry(entry.id)}
                                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
