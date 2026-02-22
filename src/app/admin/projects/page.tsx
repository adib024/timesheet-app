'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Navigation/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getRandomProjectColor, getBudgetStatus } from '@/lib/utils'

interface Project {
    id: string
    name: string
    color: string
    totalHours: number
    usedHours: number
    status: string
    remainingHours: number
    percentageUsed: number
    assignedUsers?: { id: string; name: string | null; email: string | null }[]
}

interface User {
    id: string
    name: string | null
    email: string | null
}

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [formData, setFormData] = useState({ name: '', totalHours: '' })
    const [isSaving, setIsSaving] = useState(false)

    const fetchData = async () => {
        try {
            const [projectsRes, usersRes] = await Promise.all([
                fetch('/api/projects?includeArchived=true'),
                fetch('/api/users'),
            ])

            const projectsJson = await projectsRes.json()
            const usersJson = await usersRes.json()

            setProjects(projectsJson.data || [])
            setUsers(usersJson.data || [])
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreateProject = async () => {
        if (!formData.name.trim()) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    totalHours: parseFloat(formData.totalHours) || 0,
                    color: getRandomProjectColor(),
                }),
            })

            const json = await res.json()

            if (res.ok && json.success) {
                setIsModalOpen(false)
                setFormData({ name: '', totalHours: '' })
                await fetchData()
            } else {
                alert(`Failed to create project: ${json.error || res.statusText}`)
            }
        } catch (error) {
            console.error('Create project error:', error)
            alert('Failed to create project. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateProject = async () => {
        if (!editingProject || !formData.name.trim()) return

        setIsSaving(true)
        try {
            const res = await fetch(`/api/projects/${editingProject.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    totalHours: parseFloat(formData.totalHours) || 0,
                }),
            })

            if (res.ok) {
                setEditingProject(null)
                setFormData({ name: '', totalHours: '' })
                await fetchData()
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleArchiveProject = async (projectId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
        await fetch(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        })
        await fetchData()
    }

    const handleAssignUser = async (projectId: string, userId: string) => {
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, userId }),
            })

            if (res.ok) {
                // Success feedback
                // Ideally use a toast component, but for now alert as requested or verify if toast exists
                // The user said "Verify: Success message appears"
                alert('User assigned successfully!')
                await fetchData()
            } else {
                const json = await res.json()
                alert(json.error || 'Failed to assign user')
            }
        } catch (error) {
            console.error('Assignment error:', error)
            alert('Failed to assign user')
        }
    }

    const handleUnassignUser = async (projectId: string, userId: string) => {
        if (!confirm('Remove this user from the project?')) return

        await fetch(`/api/assignments?projectId=${projectId}&userId=${userId}`, {
            method: 'DELETE',
        })
        await fetchData()
    }

    const openEditModal = (project: Project) => {
        setEditingProject(project)
        setFormData({ name: project.name, totalHours: project.totalHours.toString() })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    const activeProjects = projects.filter(p => p.status === 'ACTIVE')
    const archivedProjects = projects.filter(p => p.status === 'ARCHIVED')

    return (
        <div>
            <Header title="Manage Projects" />

            <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-gray-600">{activeProjects.length} active projects</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        + New Project
                    </Button>
                </div>

                {/* Active Projects */}
                <Card>
                    <CardHeader title="Active Projects" />
                    <div className="space-y-4">
                        {activeProjects.map((project) => (
                            <div key={project.id} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-4 h-4 rounded-full ${getBudgetStatus(project.percentageUsed) === 'green' ? 'bg-green-500' :
                                                getBudgetStatus(project.percentageUsed) === 'yellow' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                }`}
                                        />
                                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openEditModal(project)}>
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleArchiveProject(project.id, project.status)}
                                        >
                                            Archive
                                        </Button>
                                    </div>
                                </div>

                                {project.totalHours > 0 && (
                                    <div className="mb-3">
                                        <ProgressBar value={project.usedHours} max={project.totalHours} showLabel size="sm" />
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-gray-500">Assigned:</span>
                                    {project.assignedUsers?.map((user) => (
                                        <span
                                            key={user.id}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                                        >
                                            {user.name || user.email}
                                            <button
                                                onClick={() => handleUnassignUser(project.id, user.id)}
                                                className="ml-1 text-gray-400 hover:text-red-600"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    <select
                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                        value=""
                                        onChange={(e) => e.target.value && handleAssignUser(project.id, e.target.value)}
                                    >
                                        <option value="">+ Add user</option>
                                        {users
                                            .filter(u => !project.assignedUsers?.some(a => a.id === u.id))
                                            .map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name || user.email}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Archived Projects */}
                {archivedProjects.length > 0 && (
                    <Card>
                        <CardHeader title="Archived Projects" />
                        <div className="space-y-2">
                            {archivedProjects.map((project) => (
                                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full opacity-50" style={{ backgroundColor: project.color }} />
                                        <span className="text-gray-600">{project.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleArchiveProject(project.id, project.status)}
                                    >
                                        Restore
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Project"
            >
                <div className="space-y-4">
                    <Input
                        label="Project Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter project name"
                    />
                    <Input
                        label="Budget (hours)"
                        type="number"
                        value={formData.totalHours}
                        onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                        placeholder="0"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateProject} isLoading={isSaving}>
                            Create Project
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingProject}
                onClose={() => setEditingProject(null)}
                title="Edit Project"
            >
                <div className="space-y-4">
                    <Input
                        label="Project Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Budget (hours)"
                        type="number"
                        value={formData.totalHours}
                        onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setEditingProject(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateProject} isLoading={isSaving}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
