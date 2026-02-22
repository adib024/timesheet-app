'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Home, Clock, Briefcase, BarChart2, Users, Settings, User, Menu, X, Shield, FileText, Calendar, LayoutDashboard } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

export function TopHeader() {
    const pathname = usePathname()
    // Rename to avoid conflict with useState, though conflict only happens if named same
    const { data: session } = useSession()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const isAdmin = session?.user?.role === 'ADMIN' || pathname?.startsWith('/admin')

    // Helper to check active state
    const isActive = (path: string) => pathname === path

    // Navigation Items
    const userNavItems = [
        { label: 'Dashboard', path: '/dashboard', icon: Home },
        { label: 'Timesheets', path: '/dashboard/timesheet', icon: Clock },
        { label: 'Projects', path: '/dashboard/projects', icon: Briefcase },


        { label: 'Leave', path: '/dashboard/leave', icon: Calendar },

    ]

    const adminNavItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Timesheets', path: '/admin/timesheets', icon: Clock },
        { label: 'Projects', path: '/admin/projects', icon: Briefcase },
        { label: 'Leave', path: '/admin/leave', icon: Calendar },
        { label: 'Reports', path: '/admin/reports', icon: BarChart2 },
        { label: 'Team', path: '/admin/team', icon: Users },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
    ]

    const navItems = isAdmin ? adminNavItems : userNavItems

    return (
        <header className="bg-brand-teal text-white shadow-lg relative z-50">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                            {/* Vertical Stem */}
                            <path d="M30 20 H50 V80 H30 V20 Z" />
                            {/* Top Arm */}
                            <path d="M50 20 H80 V40 H50" />
                            {/* Middle Angle */}
                            <path d="M50 50 L75 50 L50 70" />
                            {/* Diagonal Fold */}
                            <path d="M30 80 L50 60" />
                        </svg>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.path)
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 group
                                    ${active
                                        ? 'bg-white text-brand-teal font-bold shadow-md'
                                        : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${active ? 'text-brand-pink' : 'text-white group-hover:text-brand-yellow'} transition-colors`} />
                                <span className="uppercase tracking-wide text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* User Actions & Mobile Toggle */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                        <User className="w-4 h-4 text-brand-yellow" />
                        <span className="text-sm font-medium">{session?.user?.name || 'User'}</span>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-20 left-0 w-full bg-brand-teal border-t border-white/10 shadow-xl animate-slide-in">
                    <nav className="flex flex-col p-4 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.path)
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-all
                                        ${active
                                            ? 'bg-white text-brand-teal font-bold'
                                            : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'text-brand-pink' : 'text-brand-yellow'}`} />
                                    <span className="uppercase tracking-wide text-sm">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}
        </header>
    )
}
