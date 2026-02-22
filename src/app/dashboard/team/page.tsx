'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface User {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    image?: string | null
}

// Mock stats for the template look
interface UserStats {
    hoursPerWeek: number
    projectsCount: number
    initials: string
    color: string
}

const AVATAR_COLORS = ['bg-brand-teal', 'bg-brand-pink', 'bg-brand-yellow']

export default function TeamPage() {
    const [users, setUsers] = useState<(User & UserStats)[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users')
                if (res.ok) {
                    const json = await res.json()
                    const fetchedUsers = json.data || []

                    // Augment with mock stats to match template visual density
                    const augmentedUsers = fetchedUsers.map((u: User, index: number) => {
                        const names = u.name ? u.name.split(' ') : ['?', '?']
                        const initials = (names[0][0] + (names[1] ? names[1][0] : '')).toUpperCase()

                        return {
                            ...u,
                            hoursPerWeek: 35 + Math.floor(Math.random() * 10), // Mock 35-45 hours
                            projectsCount: 3 + Math.floor(Math.random() * 5), // Mock 3-8 projects
                            initials,
                            color: AVATAR_COLORS[index % AVATAR_COLORS.length]
                        }
                    })
                    setUsers(augmentedUsers)
                }
            } catch (error) {
                console.error('Failed to fetch users:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()
    }, [])

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
                <div className="bg-white p-6 rounded-2xl shadow-card flex flex-col justify-center items-center text-center">
                    <div className="text-4xl font-bold text-brand-teal mb-2">{users.length}</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Team Members</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card flex flex-col justify-center items-center text-center">
                    <div className="text-4xl font-bold text-brand-teal mb-2">{users.filter(u => u.isActive).length}</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Members</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card flex flex-col justify-center items-center text-center">
                    <div className="text-4xl font-bold text-brand-teal mb-2">92%</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Avg Utilization</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-card flex flex-col justify-center items-center text-center">
                    <div className="text-4xl font-bold text-brand-teal mb-2">4.5</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Avg Projects/Person</div>
                </div>
            </div>

            {/* Header & Actions */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-teal uppercase tracking-wide">Team Members</h2>
                <Button className="bg-brand-teal hover:bg-opacity-90 text-white font-bold uppercase tracking-wide px-6 py-2 rounded-lg">
                    + Add Member
                </Button>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {users.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">No team members found</div>
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="bg-white rounded-2xl p-8 shadow-card text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-white shadow-lg ${user.color}`}>
                                {user.initials}
                            </div>
                            <h3 className="text-xl font-bold text-brand-teal mb-2">{user.name}</h3>
                            <div className="text-gray-500 font-medium mb-6 uppercase tracking-wide text-sm">{user.role}</div>

                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-brand-teal">{user.hoursPerWeek}</div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hours/Week</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-brand-teal">{user.projectsCount}</div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Projects</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
