import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { TopHeader } from '@/components/Navigation/TopHeader'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Rely on middleware for session protection. 
    // Just a final safety check for role if needed, but middleware handles this too.
    return (
        <div className="min-h-screen bg-gray-50 font-barlow">
            <TopHeader />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
