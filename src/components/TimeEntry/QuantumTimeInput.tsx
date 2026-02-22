'use client'

import { cn } from '@/lib/utils'

interface QuantumTimeInputProps {
    value: string // Expecting string "8.0" or "7.5" to match parent state
    onChange: (value: string) => void
    className?: string
}

export function QuantumTimeInput({ value, onChange, className }: QuantumTimeInputProps) {
    // Derive state directly from props to avoid sync issues
    const floatVal = parseFloat(value) || 0
    const hours = Math.floor(floatVal)
    const minutes = Math.round((floatVal - hours) * 60)

    const updateTime = (h: number, m: number) => {
        // Calculate decimal value
        const decimal = h + (m / 60)
        // Pass string back to parent
        onChange(decimal.toString())
    }

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newH = parseInt(e.target.value)
        updateTime(newH, minutes)
    }

    const handleMinuteClick = (m: number) => {
        updateTime(hours, m)
    }

    const minuteOptions = [0, 15, 30, 45]

    return (
        <div className={cn("bg-gray-50 p-4 rounded-xl border border-gray-200", className)}>

            {/* Header / Current Value */}
            <div className="flex justify-between items-center mb-4">
                <label className="text-gray-600 font-semibold uppercase text-xs tracking-wider">Duration</label>
                <div className="text-2xl font-bold text-brand-teal font-barlow">
                    {hours}h {minutes > 0 && `${minutes}m`}
                </div>
            </div>

            {/* Hours Slider */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                    <span>0h</span>
                    <span>4h</span>
                    <span>8h</span>
                    <span>12h</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={hours}
                    onChange={handleSliderChange}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-teal hover:accent-brand-teal-dark transition-all"
                />
            </div>

            {/* Minute Pills */}
            <div className="grid grid-cols-4 gap-2">
                {minuteOptions.map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => handleMinuteClick(m)}
                        className={cn(
                            "py-2 rounded-lg text-sm font-bold transition-all border",
                            minutes === m
                                ? "bg-brand-teal text-white border-brand-teal shadow-md transform scale-105"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                        )}
                    >
                        {m === 0 ? '00' : m}
                    </button>
                ))}
            </div>
        </div>
    )
}
