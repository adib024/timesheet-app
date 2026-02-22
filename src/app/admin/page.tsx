'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Navigation/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getBudgetStatus } from '@/lib/utils'
import { StatsModal } from '@/components/Admin/StatsModal'

interface Project {
    id: string
    name: string
    color: string
    totalHours: number
    usedHours: number
    status: string
    remainingHours: number
    percentageUsed: number
}

interface User {
    id: string
    name: string | null
    email: string | null
    role: string
    isActive: boolean
}

export default function AdminDashboardPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statsData, setStatsData] = useState<any>(null)
    const [showStatsModal, setShowStatsModal] = useState(false)
    const [statsTab, setStatsTab] = useState<'projects' | 'users'>('projects')

    useEffect(() => {
        async function fetchData() {
            try {
                const [projectsRes, usersRes, statsRes] = await Promise.all([
                    fetch('/api/projects?includeArchived=true'),
                    fetch('/api/users'),
                    fetch('/api/admin/stats'),
                ])

                const projectsJson = await projectsRes.json()
                const usersJson = await usersRes.json()
                const statsJson = await statsRes.json()

                setProjects(projectsJson.data || [])
                setUsers(usersJson.data || [])
                setStatsData(statsJson.data || null)
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const activeProjects = projects.filter(p => p.status === 'ACTIVE')
    const healthyProjects = activeProjects.filter(p => getBudgetStatus(p.percentageUsed) === 'green')
    const warningProjects = activeProjects.filter(p => getBudgetStatus(p.percentageUsed) === 'yellow')
    const overBudgetProjects = activeProjects.filter(p => getBudgetStatus(p.percentageUsed) === 'red')

    const totalBudgetHours = activeProjects.reduce((sum, p) => sum + p.totalHours, 0)
    const totalUsedHours = activeProjects.reduce((sum, p) => sum + p.usedHours, 0)
    const activeUsers = users.filter(u => u.isActive)

    const handleOpenStats = (tab: 'projects' | 'users') => {
        setStatsTab(tab)
        setShowStatsModal(true)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div>
            <Header title="Admin Dashboard" />

            <div className="p-8 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Projects</p>
                                <p className="text-3xl font-bold text-gray-900">{activeProjects.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Users</p>
                                <p className="text-3xl font-bold text-gray-900">{activeUsers.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <div onClick={() => handleOpenStats('projects')} className="cursor-pointer group">
                        <Card className="group-hover:ring-2 ring-blue-400 transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Total Hours Used</p>
                                    <p className="text-3xl font-bold text-gray-900">{totalUsedHours.toFixed(0)}h</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Click for breakdown ↓
                            </div>
                        </Card>
                    </div>


                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Project Health */}
                    <Card className="lg:col-span-2">
                        <CardHeader
                            title="Project Health"
                            description="Overview of all active projects and their budget status"
                        />

                        <div className="flex gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="text-sm text-gray-600">Healthy ({healthyProjects.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                                <span className="text-sm text-gray-600">Warning ({warningProjects.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                                <span className="text-sm text-gray-600">Over Budget ({overBudgetProjects.length})</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div
                                            className={`w-3 h-3 rounded-full ${getBudgetStatus(project.percentageUsed) === 'green' ? 'bg-green-500' :
                                                getBudgetStatus(project.percentageUsed) === 'yellow' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`}
                                        />
                                        <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                                    </div>
                                    <ProgressBar
                                        value={project.usedHours}
                                        max={project.totalHours}
                                        showLabel
                                        size="md"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {project.remainingHours.toFixed(1)}h remaining of {project.totalHours}h
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Users on Leave */}
                    <Card>
                        <CardHeader
                            title="On Leave Today"
                            description={`${statsData?.usersOnLeave?.length || 0} user(s) away`}
                        />

                        {!statsData?.usersOnLeave?.length ? (
                            <div className="text-center py-8 text-gray-500">
                                Everyone is in today!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {statsData.usersOnLeave.map((user: any) => (
                                    <div key={user.userId} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
                                            {user.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.name || 'Unknown User'}</p>
                                            <p className="text-xs text-orange-600 capitalize">{user.type.toLowerCase()} Leave</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <a href="/admin/projects" className="block">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Manage Projects</h3>
                                    <p className="text-sm text-gray-500">Create, edit, and assign users</p>
                                </div>
                            </div>
                        </Card>
                    </a>

                    <a href="/admin/team" className="block">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Manage Users</h3>
                                    <p className="text-sm text-gray-500">View and update user roles</p>
                                </div>
                            </div>
                        </Card>
                    </a>

                    <a href="/admin/reports" className="block">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">View Reports</h3>
                                    <p className="text-sm text-gray-500">Generate and export reports</p>
                                </div>
                            </div>
                        </Card>
                    </a>
                </div>
            </div>

            <StatsModal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                data={statsData}
                initialTab={statsTab}
            />
        </div>
    )
}
