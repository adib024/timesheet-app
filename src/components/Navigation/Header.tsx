'use client'

import { format } from 'date-fns'


interface HeaderProps {
    title: string
    userName?: string | null
}

export function Header({ title, userName }: HeaderProps) {
    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                </div>


            </div>
        </header>
    )
}
