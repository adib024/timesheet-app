'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')

    const [settings, setSettings] = useState({
        companyName: 'Image Foundry',
        emailDomain: 'loveimagefoundry.com',
        currency: 'GBP',
        weeklyTarget: 40,

        allowOvertime: true,
        trackLeave: true,
        budgetAlerts: true,
        alertThreshold: 85,
        autoArchive: false
    })

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data && Object.keys(json.data).length > 0) {
                    setSettings(prev => ({
                        ...prev,
                        ...Object.entries(json.data).reduce((acc, [key, val]) => {
                            if (val === 'true') acc[key] = true
                            else if (val === 'false') acc[key] = false
                            else if (!isNaN(Number(val)) && key !== 'companyName' && key !== 'emailDomain' && key !== 'currency') acc[key] = Number(val)
                            else acc[key] = val
                            return acc
                        }, {} as any)
                    }))
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false))
    }, [])

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key as keyof typeof settings]
        }))
    }

    const handleChange = (key: keyof typeof settings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage('')
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            const json = await res.json()
            if (json.success) {
                setMessage('Settings saved successfully!')
                setTimeout(() => setMessage(''), 3000)
            } else {
                setMessage('Error saving settings: ' + json.error)
            }
        } catch (error) {
            setMessage('Error saving settings')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

    return (
        <div className="space-y-6 animate-fade-in font-barlow">
            <h1 className="text-4xl font-bold text-brand-teal mb-8">System Settings</h1>

            <div className="bg-white rounded-2xl shadow-card p-8 space-y-8">
                {/* Section 1: General */}
                <div className="pb-8 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-brand-teal mb-6">Company Information</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Company Name</label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Email Domain</label>
                            <input
                                type="text"
                                value={settings.emailDomain}
                                onChange={(e) => handleChange('emailDomain', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Default Currency</label>
                            <select
                                value={settings.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-teal bg-white"
                            >
                                <option value="GBP">GBP (£)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 2: Timesheet Settings */}
                <div className="pb-8 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-brand-teal mb-6">Timesheet Policies</h3>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center py-2">
                            <div>
                                <div className="font-bold text-gray-800 text-lg">Weekly Target Hours</div>
                                <div className="text-gray-500">Default expected hours per week</div>
                            </div>
                            <input
                                type="number"
                                value={settings.weeklyTarget}
                                onChange={(e) => handleChange('weeklyTarget', parseInt(e.target.value))}
                                className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-center font-bold text-lg focus:outline-none focus:border-brand-teal"
                            />
                        </div>



                        <ToggleRow
                            label="Allow Overtime Entry"
                            description="Team members can log hours beyond weekly target"
                            checked={settings.allowOvertime}
                            onChange={() => handleToggle('allowOvertime')}
                        />

                        <ToggleRow
                            label="Track Leave/Holidays"
                            description="Enable leave tracking in timesheets"
                            checked={settings.trackLeave}
                            onChange={() => handleToggle('trackLeave')}
                        />
                    </div>
                </div>

                {/* Section 3: Project Management */}
                <div className="pb-8">
                    <h3 className="text-xl font-bold text-brand-teal mb-6">Project Management</h3>

                    <div className="space-y-6">
                        <ToggleRow
                            label="Budget Alerts"
                            description="Send alerts when projects approach budget limits"
                            checked={settings.budgetAlerts}
                            onChange={() => handleToggle('budgetAlerts')}
                        />

                        <div className="flex justify-between items-center py-2">
                            <div>
                                <div className="font-bold text-gray-800 text-lg">Budget Alert Threshold (%)</div>
                                <div className="text-gray-500">Percentage of budget to trigger alert</div>
                            </div>
                            <input
                                type="number"
                                value={settings.alertThreshold}
                                onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value))}
                                className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-center font-bold text-lg focus:outline-none focus:border-brand-teal"
                            />
                        </div>

                        <ToggleRow
                            label="Auto-Archive Completed"
                            description="Automatically archive projects after completion"
                            checked={settings.autoArchive}
                            onChange={() => handleToggle('autoArchive')}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-between pt-4 items-center">
                    <span className={`font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</span>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="text-gray-500 font-bold uppercase tracking-wide">Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-brand-teal hover:bg-opacity-90 text-white font-bold uppercase tracking-wide px-8 py-3 rounded-lg text-lg shadow-lg disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ToggleRow({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: () => void }) {
    return (
        <div className="flex justify-between items-center py-2">
            <div>
                <div className="font-bold text-gray-800 text-lg">{label}</div>
                <div className="text-gray-500">{description}</div>
            </div>
            <div
                onClick={onChange}
                className={`w-14 h-8 rounded-full cursor-pointer relative transition-colors duration-300 ${checked ? 'bg-brand-teal' : 'bg-gray-300'
                    }`}
            >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${checked ? 'left-7' : 'left-1'
                    }`} />
            </div>
        </div>
    )
}
