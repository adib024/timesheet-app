'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const Logo = () => (
    <svg className="w-12 h-12" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,20 80,20 80,45 45,45 45,80 20,80" fill="white" />
        <polygon points="50,50 80,50 65,80 50,80" fill="white" />
    </svg>
)

const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Timesheets', href: '/timesheets' },
    { name: 'Projects', href: '/projects' },
    { name: 'Reports', href: '/reports' },
    { name: 'Team', href: '/team' },
    { name: 'Leave', href: '/leave' },
]

export function Header() {
    const pathname = usePathname()
    const { data: session } = useSession()

    return (
        <header className="bg-brand-teal text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-8 py-6">
                <div className="flex justify-between items-center">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                        <Logo />
                        <div className="text-3xl font-bold tracking-widest">IMAGE FOUNDRY</div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-lg font-medium transition-all pb-1 border-b-4 ${pathname === item.href
                                        ? 'border-brand-yellow'
                                        : 'border-transparent hover:opacity-80'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        {session?.user?.email && (
                            <button
                                onClick={() => signOut()}
                                className="text-lg font-medium hover:opacity-80 transition-opacity"
                            >
                                Sign Out
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    )
}
