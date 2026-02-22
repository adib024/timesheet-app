'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday } from 'date-fns'

interface UserInfo {
    id: string
    name: string | null
    email: string | null
}

interface LeaveDay {
    id: string
    date: string
    type: string
    notes?: string | null
    userId: string
    user?: UserInfo
}

interface Entitlement {
    userId: string
    year: number
    baseAllowance: number
    extraAllowance: number
    totalAllowance: number
    used: number
    remaining: number
}

interface BankHoliday {
    date: string
    name: string
}

const LEAVE_COLORS: Record<string, string> = {
    SICK: '#B00555',
    OTHER: '#6b7280',
    ANNUAL: '#00657d',
    HOLIDAY: '#F7AE00',
}

const USER_COLORS = [
    '#00657d', '#B00555', '#F7AE00', '#6366f1', '#10b981',
    '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

export default function AdminLeavePage() {
    const [users, setUsers] = useState<UserInfo[]>([])
    const [entitlements, setEntitlements] = useState<Record<string, Entitlement>>({})
    const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([])
    const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [isLoading, setIsLoading] = useState(true)
    const [showGrantModal, setShowGrantModal] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState('')
    const [extraDays, setExtraDays] = useState(0)
    const [extraReason, setExtraReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const currentYear = new Date().getFullYear()

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/users')
            const json = await res.json()
            if (json.data) {
                // Filter to active non-admin users (artists)
                const artists = json.data.filter((u: any) => u.role !== 'ADMIN' && u.isActive)
                setUsers(artists)
                return artists
            }
            return []
        } catch (error) {
            console.error('Failed to fetch users:', error)
            return []
        }
    }, [])

    const fetchEntitlements = useCallback(async (userList: UserInfo[]) => {
        const entMap: Record<string, Entitlement> = {}
        await Promise.all(
            userList.map(async (user) => {
                try {
                    const res = await fetch(`/api/leave/entitlement?userId=${user.id}&year=${currentYear}`)
                    const json = await res.json()
                    if (json.data) {
                        entMap[user.id] = json.data
                    }
                } catch (error) {
                    console.error(`Failed to fetch entitlement for ${user.id}:`, error)
                }
            })
        )
        setEntitlements(entMap)
    }, [currentYear])

    const fetchLeaveDays = useCallback(async () => {
        const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
        const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
        try {
            const res = await fetch(`/api/leave?startDate=${startDate}&endDate=${endDate}`)
            const json = await res.json()
            setLeaveDays(json.data || [])
        } catch (error) {
            console.error('Failed to fetch leave days:', error)
        }
    }, [currentMonth])

    const fetchBankHolidays = useCallback(async () => {
        try {
            const res = await fetch(`/api/leave/bank-holidays?year=${currentYear}`)
            const json = await res.json()
            setBankHolidays(json.data || [])
        } catch (error) {
            console.error('Failed to fetch bank holidays:', error)
        }
    }, [currentYear])

    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true)
            const artistList = await fetchUsers()
            await Promise.all([
                fetchEntitlements(artistList),
                fetchLeaveDays(),
                fetchBankHolidays(),
            ])
            setIsLoading(false)
        }
        loadAll()
    }, [fetchUsers, fetchEntitlements, fetchLeaveDays, fetchBankHolidays])

    const handleGrantExtra = async () => {
        if (!selectedUserId || extraDays <= 0) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/leave/entitlement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    year: currentYear,
                    extraDays,
                    reason: extraReason,
                }),
            })

            if (res.ok) {
                await fetchEntitlements(users)
                setShowGrantModal(false)
                setSelectedUserId('')
                setExtraDays(0)
                setExtraReason('')
            }
        } catch (error) {
            console.error('Error granting extra days:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const openGrantForUser = (userId: string) => {
        setSelectedUserId(userId)
        const existing = entitlements[userId]
        setExtraDays(existing?.extraAllowance || 0)
        setShowGrantModal(true)
    }

    // Calendar helpers
    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    })

    const getLeavesForDate = (date: Date): LeaveDay[] => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return leaveDays.filter(l => l.date.split('T')[0] === dateStr)
    }

    const getBankHolidayForDate = (date: Date): BankHoliday | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return bankHolidays.find(bh => bh.date === dateStr)
    }

    const getUserColor = (userId: string): string => {
        const idx = users.findIndex(u => u.id === userId)
        return USER_COLORS[idx % USER_COLORS.length]
    }

    const getUsagePercent = (ent: Entitlement) => {
        if (ent.totalAllowance === 0) return 0
        return Math.round((ent.used / ent.totalAllowance) * 100)
    }

    const getUsageColor = (percent: number) => {
        if (percent >= 80) return '#B00555'
        if (percent >= 50) return '#F7AE00'
        return '#00657d'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-teal uppercase tracking-wide">Leave Management</h1>
                <Button onClick={() => { setSelectedUserId(''); setExtraDays(0); setExtraReason(''); setShowGrantModal(true) }}>
                    + Grant Extra Days
                </Button>
            </div>

            {/* Section A: Team Leave Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {users.map((user) => {
                    const ent = entitlements[user.id]
                    if (!ent) return null
                    const percent = getUsagePercent(ent)
                    const color = getUsageColor(percent)
                    const circumference = 2 * Math.PI * 36

                    return (
                        <Card key={user.id} className="relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                {/* Circular Progress */}
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                        <circle
                                            cx="40" cy="40" r="36" fill="none"
                                            stroke={color} strokeWidth="6"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={circumference - (circumference * percent / 100)}
                                            strokeLinecap="round"
                                            className="transition-all duration-500"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold" style={{ color }}>{percent}%</span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{user.name || user.email?.split('@')[0]}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {ent.used} used / {ent.totalAllowance} total
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color }}>
                                        {ent.remaining} remaining
                                    </p>
                                    {ent.extraAllowance > 0 && (
                                        <p className="text-xs text-indigo-600 mt-0.5">
                                            +{ent.extraAllowance} extra
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Action */}
                            <button
                                onClick={() => openGrantForUser(user.id)}
                                className="mt-3 w-full text-xs text-brand-teal hover:bg-brand-teal/5 py-1.5 rounded border border-brand-teal/20 transition-colors"
                            >
                                Grant Extra Days
                            </button>
                        </Card>
                    )
                })}
            </div>

            {/* Section B: Team Calendar */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    >
                        ← Previous
                    </Button>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    >
                        Next →
                    </Button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs">
                    {users.map((user, idx) => (
                        <div key={user.id} className="flex items-center gap-1.5">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: USER_COLORS[idx % USER_COLORS.length] }}
                            />
                            <span className="text-gray-600">{user.name || user.email?.split('@')[0]}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="text-gray-600">Bank Holiday</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {days.map((day) => {
                        const dayLeaves = getLeavesForDate(day)
                        const bankHoliday = getBankHolidayForDate(day)
                        const weekend = isWeekend(day)
                        const today = isToday(day)

                        return (
                            <div
                                key={day.toISOString()}
                                className={`
                                    relative p-2 rounded-lg min-h-[60px] transition-all
                                    ${today ? 'ring-2 ring-brand-teal' : ''}
                                    ${bankHoliday ? 'bg-yellow-50 border border-yellow-200' : weekend ? 'bg-gray-50' : 'bg-white border border-gray-100'}
                                `}
                                title={bankHoliday?.name}
                            >
                                <span className={`text-xs ${today ? 'font-bold text-brand-teal' : 'text-gray-500'}`}>
                                    {format(day, 'd')}
                                </span>

                                {bankHoliday && (
                                    <div className="text-[9px] text-yellow-700 font-medium mt-0.5 truncate" title={bankHoliday.name}>
                                        🏛️ {bankHoliday.name}
                                    </div>
                                )}

                                {/* Leave dots */}
                                <div className="flex flex-wrap gap-0.5 mt-1">
                                    {dayLeaves.map((leave) => (
                                        <div
                                            key={leave.id}
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: getUserColor(leave.userId) }}
                                            title={`${leave.user?.name || 'User'} — ${leave.type}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Section C: Recent Leave Entries */}
            <Card>
                <h3 className="font-semibold text-gray-900 mb-4">Recent Leave Entries</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Artist</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Notes</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Day</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveDays.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-400">
                                        No leave entries for this month
                                    </td>
                                </tr>
                            ) : (
                                leaveDays
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((leave) => (
                                        <tr key={leave.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{ backgroundColor: getUserColor(leave.userId) }}
                                                    />
                                                    <span className="font-medium text-gray-900">
                                                        {leave.user?.name || leave.user?.email?.split('@')[0] || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {format(new Date(leave.date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                                    style={{ backgroundColor: LEAVE_COLORS[leave.type] || '#6b7280' }}
                                                >
                                                    {leave.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 text-sm italic">
                                                {leave.notes || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-500">
                                                {format(new Date(leave.date), 'EEEE')}
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Grant Extra Days Modal */}
            <Modal
                isOpen={showGrantModal}
                onClose={() => setShowGrantModal(false)}
                title="Grant Extra Leave Days"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Artist
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => {
                                setSelectedUserId(e.target.value)
                                const existing = entitlements[e.target.value]
                                setExtraDays(existing?.extraAllowance || 0)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                        >
                            <option value="">Choose an artist...</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name || user.email?.split('@')[0]}
                                    {entitlements[user.id] ? ` (${entitlements[user.id].remaining} remaining)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Extra Days to Allocate
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={50}
                            value={extraDays}
                            onChange={(e) => setExtraDays(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Total will be: 25 base + {extraDays} extra = {25 + extraDays} days
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason (optional)
                        </label>
                        <textarea
                            value={extraReason}
                            onChange={(e) => setExtraReason(e.target.value)}
                            placeholder="e.g., Outstanding performance, Compassionate leave"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowGrantModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleGrantExtra}
                            isLoading={isSubmitting}
                            disabled={!selectedUserId || extraDays < 0}
                        >
                            Grant {extraDays} Extra Days
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
