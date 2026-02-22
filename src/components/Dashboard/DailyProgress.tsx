import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatTime } from '@/lib/utils'

interface DailyProgressProps {
    totalMinutes: number
    targetMinutes: number
    isLeave: boolean
}

export function DailyProgress({ totalMinutes, targetMinutes, isLeave }: DailyProgressProps) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const targetHours = targetMinutes / 60
    const percentage = Math.round((totalMinutes / targetMinutes) * 100)
    const isComplete = totalMinutes >= targetMinutes

    if (isLeave) {
        return (
            <Card className="bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900">Leave Day</h3>
                        <p className="text-sm text-blue-700">You&apos;re on leave today. Enjoy your time off!</p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Progress</h3>
                    <p className="text-sm text-gray-500">Target: {targetHours} hours</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${isComplete
                        ? 'bg-green-100 text-green-700'
                        : percentage >= 80
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                    {isComplete ? '✓ Complete' : `${percentage}%`}
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">{formatTime(hours, minutes)}</span>
                <span className="text-gray-500">/ {targetHours}h</span>
            </div>

            <ProgressBar
                value={totalMinutes}
                max={targetMinutes}
                size="lg"
            />

            {!isComplete && totalMinutes > 0 && (
                <p className="text-sm text-gray-500 mt-3">
                    {formatTime(Math.floor((targetMinutes - totalMinutes) / 60), (targetMinutes - totalMinutes) % 60)} remaining
                </p>
            )}
        </Card>
    )
}
