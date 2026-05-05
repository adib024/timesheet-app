'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend, isBefore, startOfDay } from 'date-fns'

interface LeaveDay {
    id: string
    date: string
    type: string
    isHalfDay?: boolean
    notes?: string | null
}

interface Entitlement {
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

export default function LeavePage() {
    const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([])
    const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
    const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [showRemoveModal, setShowRemoveModal] = useState(false)
    const [leaveToRemove, setLeaveToRemove] = useState<LeaveDay | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [leaveType, setLeaveType] = useState('SICK')
    const [leaveNotes, setLeaveNotes] = useState('')
    const [isHalfDay, setIsHalfDay] = useState(false)

    const currentYear = new Date().getFullYear()

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

    const fetchEntitlement = useCallback(async () => {
        try {
            const res = await fetch(`/api/leave/entitlement?year=${currentYear}`)
            const json = await res.json()
            if (json.data) {
                setEntitlement(json.data)
            }
        } catch (error) {
            console.error('Failed to fetch entitlement:', error)
        }
    }, [currentYear])

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
            await Promise.all([fetchLeaveDays(), fetchEntitlement(), fetchBankHolidays()])
            setIsLoading(false)
        }
        loadAll()
    }, [fetchLeaveDays, fetchEntitlement, fetchBankHolidays])

    const getLeaveForDate = (date: Date): LeaveDay | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return leaveDays.find(l => l.date.split('T')[0] === dateStr)
    }

    const getBankHolidayForDate = (date: Date): BankHoliday | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return bankHolidays.find(bh => bh.date === dateStr)
    }

    const handleDateClick = (date: Date) => {
        const existingLeave = getLeaveForDate(date)
        if (existingLeave) return
        if (getBankHolidayForDate(date)) return // Can't request leave on bank holidays
        if (isBefore(startOfDay(date), startOfDay(new Date()))) return

        setSelectedDate(date)
        setShowConfirmModal(true)
    }

    const handleConfirmLeave = async () => {
        if (!selectedDate) return
        setIsSubmitting(true)
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const res = await fetch('/api/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr, type: leaveType, isHalfDay, notes: leaveType === 'OTHER' ? leaveNotes : null }),
            })
            if (res.ok) {
                await Promise.all([fetchLeaveDays(), fetchEntitlement()])
                setShowConfirmModal(false)
                setSelectedDate(null)
                setLeaveNotes('')
                setIsHalfDay(false)
            } else {
                const err = await res.json()
                alert(`Failed to add leave: ${err.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error adding leave:', error)
            alert('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveClick = (leave: LeaveDay) => {
        setLeaveToRemove(leave)
        setShowRemoveModal(true)
    }

    const handleConfirmRemove = async () => {
        if (!leaveToRemove) return
        setIsSubmitting(true)
        try {
            const dateStr = leaveToRemove.date.split('T')[0]
            await fetch(`/api/leave?date=${dateStr}`, { method: 'DELETE' })
            await Promise.all([fetchLeaveDays(), fetchEntitlement()])
            setShowRemoveModal(false)
            setLeaveToRemove(null)
        } catch (error) {
            console.error('Error removing leave:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    })

    const currentMonthLeaves = leaveDays.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Entitlement progress
    const usagePercent = entitlement
        ? Math.round((entitlement.used / entitlement.totalAllowance) * 100)
        : 0

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div>
            <div className="p-8 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-brand-teal uppercase tracking-wide">Leave Management</h1>
                </div>

                {/* Entitlement Tracker */}
                {entitlement && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-l-4 border-l-brand-teal">
                            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Total Entitlement</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {entitlement.totalAllowance}
                                <span className="text-sm font-normal text-gray-400 ml-1">days</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {entitlement.baseAllowance} base
                                {entitlement.extraAllowance > 0 && ` + ${entitlement.extraAllowance} extra`}
                                {' '}+ 8 bank holidays
                            </p>
                        </Card>

                        <Card className="border-l-4 border-l-brand-pink">
                            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Used</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {entitlement.used}
                                <span className="text-sm font-normal text-gray-400 ml-1">days</span>
                            </p>
                            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(usagePercent, 100)}%`,
                                        backgroundColor: usagePercent >= 80 ? '#B00555' : usagePercent >= 50 ? '#F7AE00' : '#00657d',
                                    }}
                                />
                            </div>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Remaining</p>
                            <p className="text-3xl font-bold mt-1" style={{
                                color: entitlement.remaining <= 3 ? '#B00555' : entitlement.remaining <= 10 ? '#F7AE00' : '#00657d'
                            }}>
                                {entitlement.remaining}
                                <span className="text-sm font-normal text-gray-400 ml-1">days</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {usagePercent}% of allowance used
                            </p>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <Card className="lg:col-span-2">
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
                                const leave = getLeaveForDate(day)
                                const bankHoliday = getBankHolidayForDate(day)
                                const weekend = isWeekend(day)
                                const today = isToday(day)
                                const isPast = isBefore(startOfDay(day), startOfDay(new Date()))
                                const canSelect = !leave && !bankHoliday && !isPast

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => handleDateClick(day)}
                                        disabled={!canSelect}
                                        className={`
                                            relative p-3 rounded-lg text-center transition-all
                                            ${today ? 'ring-2 ring-brand-teal' : ''}
                                            ${bankHoliday
                                                ? 'bg-yellow-50 border border-yellow-300 cursor-default'
                                                : leave
                                                    ? leave.type === 'SICK'
                                                        ? 'bg-pink-50 border border-pink-200 cursor-default'
                                                        : 'bg-gray-100 border border-gray-200 cursor-default'
                                                    : isPast
                                                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                        : weekend
                                                            ? 'bg-gray-100 text-gray-400 hover:bg-blue-50 cursor-pointer'
                                                            : 'hover:bg-blue-50 text-gray-700 cursor-pointer border border-transparent hover:border-brand-teal/30'
                                            }
                                        `}
                                        title={
                                            bankHoliday ? `🏛️ ${bankHoliday.name}`
                                                : leave ? `Leave: ${leave.type}`
                                                    : isPast ? 'Cannot mark past dates'
                                                        : 'Click to request leave'
                                        }
                                    >
                                        <span className={`text-sm ${today ? 'font-bold' : ''}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {bankHoliday && (
                                            <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 text-[9px] font-medium text-yellow-700">
                                                🏛️
                                            </span>
                                        )}
                                        {leave && (
                                            <span className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 text-[9px] font-bold uppercase ${leave.type === 'SICK' ? 'text-pink-600' : 'text-gray-500'}`}>
                                                {leave.type === 'SICK' ? 'S' : 'O'}
                                                {leave.isHalfDay ? '½' : ''}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Calendar Legend */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-yellow-50 border border-yellow-300" />
                                <span>Bank Holiday</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-pink-50 border border-pink-200" />
                                <span>Sick Leave</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                                <span>Other Leave</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-gray-500">½</span>
                                <span>Half Day</span>
                            </div>
                        </div>
                    </Card>

                    {/* Leave List */}
                    <div className="space-y-4">
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-4">Marked Leave Days</h3>

                            {currentMonthLeaves.length === 0 ? (
                                <p className="text-gray-400 text-sm">No leave days this month</p>
                            ) : (
                                <div className="space-y-2">
                                    {currentMonthLeaves.map((leave) => (
                                        <div
                                            key={leave.id}
                                            className={`flex items-center justify-between p-3 rounded-lg ${leave.type === 'SICK' ? 'bg-pink-50' : 'bg-gray-50'}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">
                                                        {format(new Date(leave.date), 'EEE, MMM d')}
                                                    </span>
                                                </div>
                                                <span className={`text-xs capitalize ${leave.type === 'SICK' ? 'text-pink-600' : 'text-gray-500'}`}>
                                                    {leave.type.toLowerCase()}{leave.isHalfDay ? ' (half day)' : ''}
                                                </span>
                                                {leave.notes && (
                                                    <span className="text-xs text-gray-400 mt-0.5 italic">
                                                        {leave.notes}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveClick(leave)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove leave"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Bank Holidays This Year */}
                        <Card className="bg-brand-teal/5 border border-brand-teal/20">
                            <h3 className="font-semibold text-brand-teal mb-3 flex items-center gap-2">
                                UK Bank Holidays {currentYear}
                            </h3>
                            <div className="space-y-1.5">
                                {bankHolidays.map((bh) => (
                                    <div key={bh.date} className="flex justify-between text-sm">
                                        <span className="text-gray-800">{bh.name}</span>
                                        <span className="text-brand-teal/70 text-xs font-medium">
                                            {format(new Date(bh.date + 'T12:00:00'), 'EEE, MMM d')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Confirm Add Leave Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => { setShowConfirmModal(false); setSelectedDate(null) }}
                title="Confirm Leave"
            >
                <div className="text-center">
                    <p className="text-gray-700 mb-2">Mark leave for:</p>
                    <p className="text-xl font-semibold text-gray-900 mb-4">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>

                    {entitlement && (
                        <p className="text-sm text-gray-500 mb-4">
                            You have <strong className="text-brand-teal">{entitlement.remaining}</strong> days remaining
                        </p>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Leave Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setLeaveType('SICK')}
                                className={`p-2 rounded border text-sm font-medium transition-colors ${leaveType === 'SICK'
                                    ? 'bg-pink-50 border-pink-500 text-pink-700 ring-1 ring-pink-500'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Sick
                            </button>
                            <button
                                type="button"
                                onClick={() => setLeaveType('OTHER')}
                                className={`p-2 rounded border text-sm font-medium transition-colors ${leaveType === 'OTHER'
                                    ? 'bg-gray-50 border-gray-500 text-gray-700 ring-1 ring-gray-500'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Other
                            </button>
                        </div>
                    </div>

                    {leaveType === 'OTHER' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Note (optional)
                            </label>
                            <textarea
                                value={leaveNotes}
                                onChange={(e) => setLeaveNotes(e.target.value)}
                                placeholder="e.g., Dentist appointment, Family event"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent resize-none"
                            />
                        </div>
                    )}

                    {/* Half Day Toggle */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsHalfDay(false)}
                                className={`p-2 rounded border text-sm font-medium transition-colors ${!isHalfDay
                                    ? 'bg-brand-teal/10 border-brand-teal text-brand-teal ring-1 ring-brand-teal'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Full Day
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsHalfDay(true)}
                                className={`p-2 rounded border text-sm font-medium transition-colors ${isHalfDay
                                    ? 'bg-brand-teal/10 border-brand-teal text-brand-teal ring-1 ring-brand-teal'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Half Day
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => { setShowConfirmModal(false); setSelectedDate(null) }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleConfirmLeave}
                            isLoading={isSubmitting}
                        >
                            Confirm Leave
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Confirm Remove Leave Modal */}
            <Modal
                isOpen={showRemoveModal}
                onClose={() => { setShowRemoveModal(false); setLeaveToRemove(null) }}
                title="Remove Leave"
            >
                <div className="text-center">
                    <p className="text-gray-700 mb-2">Remove leave for:</p>
                    <p className="text-xl font-semibold text-gray-900 mb-6">
                        {leaveToRemove && format(new Date(leaveToRemove.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => { setShowRemoveModal(false); setLeaveToRemove(null) }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={handleConfirmRemove}
                            isLoading={isSubmitting}
                        >
                            Remove Leave
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
