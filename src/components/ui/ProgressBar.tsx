import { cn, getBudgetStatus } from '@/lib/utils'

interface ProgressBarProps {
    value: number
    max?: number
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function ProgressBar({ value, max = 100, showLabel = false, size = 'md', className }: ProgressBarProps) {
    const percentage = Math.min(Math.round((value / max) * 100), 100)
    const status = getBudgetStatus(percentage)

    const heights = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    }

    const colors = {
        green: 'bg-green-500',
        yellow: 'bg-amber-500',
        red: 'bg-red-500',
    }

    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{value.toFixed(1)}h used</span>
                    <span className={cn(
                        'font-medium',
                        status === 'green' && 'text-green-600',
                        status === 'yellow' && 'text-amber-600',
                        status === 'red' && 'text-red-600'
                    )}>
                        {percentage}%
                    </span>
                </div>
            )}
            <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heights[size])}>
                <div
                    className={cn('h-full rounded-full transition-all duration-500 ease-out', colors[status])}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    )
}
