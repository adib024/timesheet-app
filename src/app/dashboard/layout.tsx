import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { TopHeader } from '@/components/Navigation/TopHeader'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 font-barlow">
            <TopHeader />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
