import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { TopHeader } from '@/components/Navigation/TopHeader'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 font-barlow">
            <TopHeader />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
