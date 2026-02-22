import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, isAfter, isBefore, parseISO } from 'date-fns'

// Tailwind class merger utility
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Round minutes to nearest 15 minutes
export function roundToNearest15(minutes: number): number {
    return Math.round(minutes / 15) * 15
}

// Convert hours and minutes to total minutes
export function toMinutes(hours: number, minutes: number): number {
    return hours * 60 + minutes
}

// Convert total minutes to hours and minutes
export function fromMinutes(totalMinutes: number): { hours: number; minutes: number } {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return { hours, minutes }
}

// Format time display (e.g., "2h 30m" or "2.5h")
export function formatTime(hours: number, minutes: number, style: 'short' | 'decimal' = 'short'): string {
    if (style === 'decimal') {
        return `${(hours + minutes / 60).toFixed(1)}h`
    }
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
}

// Format date for display
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, formatStr)
}

// Get week dates (Mon-Sun)
export function getWeekDates(date: Date = new Date()): Date[] {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 }) // Sunday
    return eachDayOfInterval({ start, end })
}

// Check if a date is within the backdate limit
export function isWithinBackdateLimit(date: Date, limitDays: number = 7): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const limitDate = subDays(today, limitDays)

    // Must be on or after limit date AND on or before today
    return !isBefore(targetDate, limitDate) && !isAfter(targetDate, today)
}

// Calculate budget percentage
export function calculateBudgetPercentage(used: number, total: number): number {
    if (total === 0) return 0
    return Math.round((used / total) * 100)
}

// Get budget status color
export function getBudgetStatus(percentage: number): 'green' | 'yellow' | 'red' {
    if (percentage >= 100) return 'red'
    if (percentage >= 80) return 'yellow'
    return 'green'
}

// Generate project colors
export const PROJECT_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
]

export function getRandomProjectColor(): string {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
}
