'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { roundToNearest15 } from '@/lib/utils'
import { Clock, Briefcase, Tag, Plus, Play } from 'lucide-react'

interface QuickAddButtonsProps {
    projects: { id: string; name: string; color: string; isFavorite?: boolean }[]
    categories: { id: string; name: string; color: string }[]
    onSubmit: (data: {
        projectId?: string
        categoryId?: string
        hours: number
        minutes: number
        notes?: string
    }) => Promise<void>
}

export function QuickAddButtons({ projects, categories, onSubmit }: QuickAddButtonsProps) {
    const [selectedProject, setSelectedProject] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const [notes, setNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const presets = [
        { label: '+15m', minutes: 15 },
        { label: '+30m', minutes: 30 },
        { label: '+1h', minutes: 60 },
    ]

    const handlePresetClick = (addMinutes: number) => {
        let totalMinutes = (hours * 60) + minutes + addMinutes
        setHours(Math.floor(totalMinutes / 60))
        setMinutes(totalMinutes % 60)
    }

    const handleSubmit = async () => {
        if (!hours && !minutes) return

        setIsLoading(true)
        try {
            await onSubmit({
                projectId: selectedProject || undefined,
                categoryId: selectedCategory || undefined,
                hours,
                minutes: roundToNearest15(minutes),
                notes: notes || undefined,
            })
            // Reset form
            setHours(0)
            setMinutes(0)
            setNotes('')
        } finally {
            setIsLoading(false)
        }
    }

    const isValid = (hours > 0 || minutes > 0) && (selectedProject !== '')

    return (
        <Card>
            <div className="flex items-center gap-2 mb-6">
                <Clock className="w-6 h-6 text-brand-teal" />
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Log Time</h3>
            </div>

            <div className="space-y-6">

                {/* 1. Select Project & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-teal uppercase tracking-wider mb-2">
                            Project <span className="text-brand-pink">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none transition-all font-medium text-gray-700"
                            >
                                <option value="">Select Project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-teal uppercase tracking-wider mb-2">
                            Category
                        </label>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none transition-all font-medium text-gray-700"
                            >
                                <option value="">General Work</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <Tag className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* 2. Time Input */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-xs font-bold text-brand-teal uppercase tracking-wider mb-3">
                        Duration
                    </label>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                value={hours}
                                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-center text-3xl font-bold text-brand-teal bg-white border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-brand-teal outline-none"
                            />
                            <span className="text-sm font-bold text-gray-400 uppercase">Hrs</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={minutes}
                                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                className="w-full text-center text-3xl font-bold text-brand-teal bg-white border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-brand-teal outline-none"
                            />
                            <span className="text-sm font-bold text-gray-400 uppercase">Min</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(preset.minutes)}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-brand-teal hover:text-brand-teal transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                        <button
                            onClick={() => { setHours(0); setMinutes(0); }}
                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors ml-auto"
                        >
                            Reset
                        </button>
                    </div>
                </div>


                {/* 3. Notes & Action */}
                <div className="flex gap-4 items-start">
                    <div className="flex-1">
                        <Input
                            placeholder="What are you working on?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !isValid}
                        isLoading={isLoading}
                        className="h-[42px] px-8 bg-brand-teal hover:bg-opacity-90 text-white font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all"
                    >
                        <Play className="w-4 h-4 fill-current mr-2" />
                        Log Time
                    </Button>
                </div>
            </div>
        </Card>
    )
}
