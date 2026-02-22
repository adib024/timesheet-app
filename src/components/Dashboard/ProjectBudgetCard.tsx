import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getBudgetStatus } from '@/lib/utils'
import { Star } from 'lucide-react'

interface ProjectBudgetCardProps {
    project: {
        id: string
        name: string
        color: string
        totalHours: number
        usedHours: number
        remainingHours: number
        percentageUsed: number
        isFavorite?: boolean
    }
    onToggleFavorite?: (projectId: string) => void
}

export function ProjectBudgetCard({ project, onToggleFavorite }: ProjectBudgetCardProps) {
    return (
        <Card padding="sm" className="hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                {/* Color dot */}
                <div
                    className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getBudgetStatus(project.percentageUsed) === 'green' ? 'bg-green-500' :
                        getBudgetStatus(project.percentageUsed) === 'yellow' ? 'bg-amber-500' :
                            'bg-red-500'
                        }`}
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                        {onToggleFavorite && (
                            <button
                                onClick={() => onToggleFavorite(project.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                <Star
                                    className={`w-4 h-4 ${project.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                            </button>
                        )}
                    </div>

                    {project.totalHours > 0 ? (
                        <>
                            <ProgressBar
                                value={project.usedHours}
                                max={project.totalHours}
                                size="sm"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{project.usedHours.toFixed(1)}h used</span>
                                <span>{project.remainingHours.toFixed(1)}h left</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-gray-400">No budget set</p>
                    )}
                </div>
            </div>
        </Card>
    )
}
