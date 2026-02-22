'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'



interface SidebarProps {
    isAdmin: boolean
    userName?: string | null
    userImage?: string | null
}

const userNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/timesheet', label: 'Timesheet', icon: 'clock' },
    { href: '/dashboard/projects', label: 'Projects', icon: 'folder' },
    { href: '/dashboard/leave', label: 'Leave', icon: 'calendar' },
]

const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/timesheets', label: 'Timesheets', icon: 'clock' },
    { href: '/admin/projects', label: 'Projects', icon: 'folder' },
    { href: '/admin/reports', label: 'Reports', icon: 'chart' },
    { href: '/admin/team', label: 'Team', icon: 'users' },
    { href: '/admin/settings', label: 'Settings', icon: 'settings' },
]

import {
    Home,
    Clock,
    Folder,
    Calendar,
    BarChart2,
    Users,
    FileText,
    List,
    LayoutDashboard,
    Settings
} from 'lucide-react'

const icons: Record<string, React.ReactNode> = {
    home: <Home className="w-5 h-5" />,
    clock: <Clock className="w-5 h-5" />,
    folder: <Folder className="w-5 h-5" />,
    calendar: <Calendar className="w-5 h-5" />,
    chart: <BarChart2 className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    document: <FileText className="w-5 h-5" />,
    list: <List className="w-5 h-5" />,
    dashboard: <LayoutDashboard className="w-5 h-5" />,
    settings: <Settings className="w-5 h-5" />,
}

export function Sidebar({ isAdmin, userName, userImage }: SidebarProps) {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900">Image Foundry</h1>
                        <p className="text-xs text-gray-500">Timesheet</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Main</p>
                {userNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            {icons[item.icon]}
                            {item.label}
                        </Link>
                    )
                })}

                {isAdmin && (
                    <>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-3">Admin</p>
                        {adminNavItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                >
                                    {icons[item.icon]}
                                    {item.label}
                                </Link>
                            )
                        })}
                    </>
                )}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-3 py-2">
                    {userImage ? (
                        <img src={userImage} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{userName || 'User'}</p>
                        <p className="text-xs text-gray-500">{isAdmin ? 'Admin' : 'Artist'}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
