'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getBudgetStatus } from '@/lib/utils'
import { Users, Calendar, Target } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Project {
    id: string
    name: string
    color: string
    totalHours: number
    usedHours: number
    remainingHours: number
    percentageUsed: number
    status: string
    isFavorite: boolean
    clientName?: string
    teamSize?: number
    dueDate?: string
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { data: session } = useSession()
    // Cast to any because standard Session type might not have role without augmentation
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/dashboard') // Using dashboard endpoint for now as it returns project stats
            const json = await res.json()
            setProjects(json.data?.projects || [])
        } catch (error) {
            console.error('Failed to fetch projects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const handleToggleFavorite = async (projectId: string, isFavorite: boolean) => {
        if (isFavorite) {
            await fetch(`/api/favorites?projectId=${projectId}`, { method: 'DELETE' })
        } else {
            await fetch(`/api/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
            })
        }
        await fetchProjects()
    }

    // Calculate Stats
    const activeProjects = projects.length
    const onTrack = projects.filter(p => p.percentageUsed < 80).length
    const atRisk = projects.filter(p => p.percentageUsed >= 80 && p.percentageUsed < 100).length
    const overBudget = projects.filter(p => p.percentageUsed >= 100).length

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in font-barlow">
            {/* Top Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal transition-transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">{activeProjects}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Projects</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal transition-transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">{onTrack}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">On Track</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal transition-transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">{atRisk}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">At Risk</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-brand-teal transition-transform hover:-translate-y-1">
                    <div className="text-5xl font-bold text-brand-teal mb-2 leading-none">{overBudget}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Over Budget</div>
                </div>
            </div>

            {/* Header & Actions */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-teal uppercase tracking-wide">All Projects</h2>
                {isAdmin && (
                    <Button className="bg-brand-teal hover:bg-opacity-90 text-white font-bold uppercase tracking-wide px-6 py-2 rounded-lg" onClick={() => alert('New Project Modal would open here')}>
                        + New Project
                    </Button>
                )}
            </div>

            {/* Project List */}
            <div className="bg-white rounded-2xl shadow-card p-8">
                {projects.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-xl text-gray-400 font-medium">No projects found</p>
                    </div>
                ) : (
                    <div className="space-y-0 divide-y divide-gray-100">
                        {projects.map((project) => (
                            <div key={project.id} className="group py-6 hover:bg-gray-50 transition-colors first:pt-0 last:pb-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-brand-teal flex items-center gap-2">
                                            {project.name}
                                            <button
                                                onClick={() => handleToggleFavorite(project.id, project.isFavorite)}
                                                className={`text-xl ${project.isFavorite ? 'text-brand-yellow' : 'text-gray-300 hover:text-brand-yellow'} transition-colors`}
                                            >
                                                ★
                                            </button>
                                        </h3>
                                        <div className="text-gray-500 mt-1 font-medium">
                                            Internal Project • {Math.round(project.usedHours)} / {project.totalHours} hours
                                        </div>
                                    </div>

                                    <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm uppercase tracking-wide ${project.percentageUsed >= 100 ? 'bg-red-100 text-brand-pink' :
                                        project.percentageUsed >= 80 ? 'bg-yellow-100 text-brand-yellow' :
                                            'bg-teal-50 text-brand-teal'
                                        }`}>
                                        <span className="text-lg">
                                            {project.percentageUsed >= 100 ? '⚠' : project.percentageUsed >= 80 ? '⏱' : '✓'}
                                        </span>
                                        <span>
                                            {project.percentageUsed >= 100 ? 'Over Budget' :
                                                project.percentageUsed >= 80 ? 'At Risk' :
                                                    'On Track'}
                                        </span>
                                    </div>
                                </div>

                                {/* Large Progress Bar */}
                                <div className="flex items-center gap-6 mb-4">
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${project.percentageUsed >= 100 ? 'bg-brand-pink' :
                                                project.percentageUsed >= 80 ? 'bg-brand-yellow' :
                                                    'bg-brand-teal'
                                                }`}
                                            style={{ width: `${Math.min(100, project.percentageUsed)}%` }}
                                        />
                                    </div>
                                    <div className={`text-2xl font-bold min-w-[4rem] text-right ${project.percentageUsed >= 100 ? 'text-brand-pink' :
                                        project.percentageUsed >= 80 ? 'text-brand-yellow' :
                                            'text-brand-teal'
                                        }`}>
                                        {Math.round(project.percentageUsed)}%
                                    </div>
                                </div>

                                <div className="flex gap-6 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-brand-teal" />
                                        {project.teamSize || 5} Team Members
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-brand-teal" />
                                        Due: {project.dueDate || 'Dec 31, 2024'}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-brand-teal" />
                                        Milestone: Ongoing
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
