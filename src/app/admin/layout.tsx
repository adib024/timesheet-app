import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { TopHeader } from '@/components/Navigation/TopHeader'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Rely on middleware for session protection. 
    // Added logging for diagnostic purposes on Vercel
    const session = await auth()
    console.log(`[AdminLayout] Rendering for: ${session?.user?.email}, Role: ${session?.user?.role}`)

    return (
        <div className="min-h-screen bg-gray-50 font-barlow">
            <TopHeader />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
