import { Modal } from '@/components/ui/Modal'
import { useState } from 'react'

interface UserStat {
    id: string
    name: string | null
    email: string | null
    hours: number
}

interface ProjectStat {
    id: string
    name: string
    hours: number
}

interface ProjectBreakdown {
    id: string
    name: string
    totalHours: number
    users: UserStat[]
}

interface UserBreakdown {
    id: string
    name: string | null
    email: string | null
    totalHours: number
    projects: ProjectStat[]
}

interface StatsModalProps {
    isOpen: boolean
    onClose: () => void
    data: {
        projectBreakdown: ProjectBreakdown[]
        userBreakdown: UserBreakdown[]
    } | null
    initialTab?: 'projects' | 'users'
}

export function StatsModal({ isOpen, onClose, data, initialTab = 'projects' }: StatsModalProps) {
    const [activeTab, setActiveTab] = useState<'projects' | 'users'>(initialTab)

    if (!data) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detailed Stats Breakdown" size="xl">
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'projects'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('projects')}
                >
                    By Project
                </button>
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'users'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('users')}
                >
                    By User
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2">
                {activeTab === 'projects' ? (
                    <div className="space-y-6">
                        {data.projectBreakdown.map((project) => (
                            <div key={project.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-900 text-lg">{project.name}</h3>
                                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {project.totalHours.toFixed(1)}h Total
                                    </span>
                                </div>
                                <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">User</th>
                                                <th className="px-4 py-2 text-right font-medium">Hours</th>

                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {project.users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="px-4 py-2 text-gray-900">
                                                        {user.name || user.email || 'Unknown User'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-gray-600">
                                                        {user.hours.toFixed(1)}h
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.userBreakdown.map((user) => (
                            <div key={user.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {user.name || user.email || 'Unknown User'}
                                    </h3>
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {user.totalHours.toFixed(1)}h Total
                                    </span>
                                </div>
                                <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">Project</th>
                                                <th className="px-4 py-2 text-right font-medium">Hours</th>

                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {user.projects.map((project) => (
                                                <tr key={project.id}>
                                                    <td className="px-4 py-2 text-gray-900">{project.name}</td>
                                                    <td className="px-4 py-2 text-right text-gray-600">
                                                        {project.hours.toFixed(1)}h
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                >
                    Close
                </button>
            </div>
        </Modal>
    )
}
