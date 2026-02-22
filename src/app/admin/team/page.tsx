'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface User {
    id: string
    name: string | null
    email: string | null
    role: string
    isActive: boolean
    createdAt: string
}

export default function AdminTeamPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            const json = await res.json()
            setUsers(json.data || [])
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleRoleChange = async (userId: string, newRole: string) => {
        await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: newRole }),
        })
        await fetchUsers()
    }

    const handleActiveToggle = async (userId: string, isActive: boolean) => {
        await fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, isActive: !isActive }),
        })
        await fetchUsers()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    const activeUsers = users.filter(u => u.isActive)
    const inactiveUsers = users.filter(u => !u.isActive)

    return (
        <div className="space-y-6 animate-fade-in font-barlow">
            <h1 className="text-4xl font-bold text-brand-teal mb-8">Manage Team</h1>

            <div className="p-8 space-y-6">
                <Card>
                    <CardHeader
                        title="Active Team Members"
                        description="Team members who can access the timesheet system"
                    />

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Member</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 font-medium text-sm">
                                                        {(user.name || user.email || '?')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-gray-900">{user.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                                        <td className="py-3 px-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                            >
                                                <option value="USER">User</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleActiveToggle(user.id, user.isActive)}
                                            >
                                                Deactivate
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {inactiveUsers.length > 0 && (
                    <Card>
                        <CardHeader
                            title="Inactive Members"
                            description="Members who can no longer access the system"
                        />
                        <div className="space-y-2">
                            {inactiveUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <span className="text-gray-600">{user.name || 'Unknown'}</span>
                                        <span className="text-gray-400 ml-2">({user.email})</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleActiveToggle(user.id, user.isActive)}
                                    >
                                        Reactivate
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card className="bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-900">Adding New Members</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                New members are automatically added when they sign in with their @loveimagefoundry.com Google account.
                                They will be assigned the &quot;User&quot; role by default.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
