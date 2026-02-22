import { ReactNode } from 'react'

interface StatCardProps {
    value: string | number
    label: string
    className?: string
}

export function StatCard({ value, label, className = '' }: StatCardProps) {
    return (
        <div className={`stat-card ${className}`}>
            <div className="text-5xl font-bold text-brand-teal leading-none mb-2">
                {value}
            </div>
            <div className="text-lg font-medium text-gray-600 uppercase tracking-wide">
                {label}
            </div>
        </div>
    )
}

interface MetricCardProps {
    title: string
    value: string | number
    progress?: number
    description?: string
    className?: string
}

export function MetricCard({
    title,
    value,
    progress,
    description,
    className = '',
}: MetricCardProps) {
    return (
        <div className={`metric-card ${className}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
            </div>
            <div className="text-4xl font-bold text-brand-teal mb-4">{value}</div>
            {progress !== undefined && (
                <>
                    <div className="progress-bar mb-2">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    {description && <div className="text-sm text-gray-500">{description}</div>}
                </>
            )}
        </div>
    )
}

interface ProjectItemProps {
    name: string
    client: string
    status: 'on-track' | 'at-risk' | 'over-budget'
    progress: number
    details?: string
    onClick?: () => void
}

export function ProjectItem({
    name,
    client,
    status,
    progress,
    details,
    onClick,
}: ProjectItemProps) {
    const statusConfig = {
        'on-track': { label: 'On Track', icon: '✓', className: 'status-on-track' },
        'at-risk': { label: 'At Risk', icon: '⏱', className: 'status-at-risk' },
        'over-budget': { label: 'Over Budget', icon: '⚠', className: 'status-over' },
    }

    const config = statusConfig[status]

    return (
        <div
            className={`p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''
                }`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-brand-teal mb-1">{name}</h3>
                    <div className="text-base text-gray-600">{client}</div>
                </div>
                <span className={`status-badge ${config.className}`}>
                    <span className="text-xl">{config.icon}</span>
                    <span>{config.label}</span>
                </span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex-1 progress-bar h-3">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${status === 'over-budget' ? 'bg-brand-pink' : status === 'at-risk' ? 'bg-brand-yellow' : 'bg-brand-teal'
                            }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <div className={`text-xl font-bold min-w-[60px] text-right ${status === 'over-budget' ? 'text-brand-pink' : status === 'at-risk' ? 'text-brand-yellow' : 'text-brand-teal'
                    }`}>
                    {progress}%
                </div>
            </div>
            {details && (
                <div className="mt-3 text-sm text-gray-500">{details}</div>
            )}
        </div>
    )
}
