'use client'

import { useState } from 'react'
import { Inter, Plus_Jakarta_Sans, Outfit, Space_Grotesk, DM_Sans, Playfair_Display } from 'next/font/google'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

// Font configurations
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

const fontOptions = [
    { name: 'Modern Premium', id: 'jakarta', font: plusJakarta, description: 'Geometric, highly legible, used by top functional SaaS products.' },
    { name: 'Clean & Neutral', id: 'inter', font: inter, description: 'The web standard. Invisible, functional, and familiar.' },
    { name: 'Stylish Geometric', id: 'outfit', font: outfit, description: 'Characterful, rounded, and modern. Good for creative brands.' },
    { name: 'Tech & Sharp', id: 'space', font: spaceGrotesk, description: 'Distinctive, quirky, and very "tech" forward.' },
    { name: 'Humanist', id: 'dm', font: dmSans, description: 'Friendly, approachable, and highly readable.' },
    { name: 'Elegant Serif', id: 'playfair', font: playfair, description: 'Classic, editorial, and sophisticated. Very "Premium".' },
]

export default function TypographyDemoPage() {
    const [selectedFont, setSelectedFont] = useState(fontOptions[0])

    return (
        <div className={`min-h-screen bg-gray-50 p-8 ${selectedFont.font.className}`}>

            {/* Control Panel */}
            <div className="fixed top-24 right-8 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-80 z-50 font-sans">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Select Font Scheme</h3>
                <div className="space-y-2">
                    {fontOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setSelectedFont(opt)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm flex flex-col gap-1
                                ${selectedFont.id === opt.id
                                    ? 'bg-brand-teal text-white shadow-md'
                                    : 'hover:bg-gray-50 text-gray-700 hover:text-brand-teal'
                                }`}
                        >
                            <span className="font-bold text-base">{opt.name}</span>
                            <span className={`text-xs ${selectedFont.id === opt.id ? 'text-white/80' : 'text-gray-400'}`}>
                                {opt.description}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-12 pb-20">

                {/* Header Section */}
                <div className="space-y-4">
                    <p className="text-brand-teal font-bold tracking-widest uppercase text-sm">Design System</p>
                    <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Elevating the <br />
                        <span className="text-brand-teal">Timesheet Experience</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl leading-relaxed">
                        Efficiently manage time, track projects, and streamline your workflow with a design that puts content first.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <Button className="bg-brand-teal text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                            Get Started
                        </Button>
                        <Button variant="ghost" className="text-gray-600 font-semibold text-lg border-2 border-transparent hover:border-gray-200 rounded-full px-8 py-3">
                            View Documentation
                        </Button>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Dashboard UI Mockup */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard Interface</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Hours', value: '38.5', trend: '+12%', color: 'text-brand-teal' },
                            { label: 'Billable Amount', value: '£1,240', trend: '+5%', color: 'text-brand-pink' },
                            { label: 'Active Projects', value: '4', trend: 'On Track', color: 'text-brand-yellow' },
                        ].map((stat, i) => (
                            <Card key={i} className="p-6 border-0 shadow-card hover:shadow-card-hover transition-all duration-300">
                                <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide mb-2">{stat.label}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-extrabold text-gray-900`}>{stat.value}</span>
                                    <span className={`text-sm font-bold ${stat.color} bg-gray-50 px-2 py-1 rounded-full`}>{stat.trend}</span>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card className="shadow-card border-0 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="text-xl font-bold text-gray-800">Recent Timesheets</h3>
                            <Button variant="ghost" className="text-sm font-bold text-brand-teal uppercase tracking-wide">View All</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Project</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hours</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[
                                        { project: 'Website Redesign', date: 'Oct 24, 2024', hours: '4:30', status: 'Approved' },
                                        { project: 'Mobile App Dev', date: 'Oct 23, 2024', hours: '6:15', status: 'Pending' },
                                        { project: 'Client Meeting', date: 'Oct 23, 2024', hours: '1:00', status: 'Approved' },
                                        { project: 'Internal Review', date: 'Oct 22, 2024', hours: '2:45', status: 'Draft' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{row.project}</div>
                                                <div className="text-xs text-gray-400">Marketing Team</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">{row.date}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-gray-700 font-bold bg-gray-100 px-2 py-1 rounded">{row.hours}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border
                                                    ${row.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        row.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
