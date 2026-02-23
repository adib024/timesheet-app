import { redirect } from 'next/navigation'
import { auth, signIn } from '@/lib/auth'

const IS_DEMO_MODE = process.env.DEMO_MODE === 'true'

export default async function LoginPage() {
    // Check for existing session — if auth() fails (DB cold start), just show login form
    try {
        const session = await auth()
        if (session?.user) {
            redirect(session.user.role === 'ADMIN' ? '/admin' : '/dashboard')
        }
    } catch (error) {
        console.error('Login page: auth() check failed, showing login form:', error)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="w-full max-w-md mx-4">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
                        <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Image Foundry</h1>
                    <p className="text-indigo-100">Timesheet Application</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-in">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h2>
                    <p className="text-gray-600 mb-8">
                        {IS_DEMO_MODE
                            ? 'Demo mode - Choose a user type to explore'
                            : 'Sign in with your company account to continue'}
                    </p>

                    {IS_DEMO_MODE ? (
                        <>
                            {/* Demo Mode - Quick Login Buttons */}
                            <div className="space-y-3">
                                <form
                                    action={async () => {
                                        'use server'
                                        await signIn('credentials', {
                                            email: 'admin@demo.com',
                                            role: 'ADMIN',
                                            redirectTo: '/admin'
                                        })
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 rounded-xl px-6 py-4 text-white font-medium hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Login as Admin
                                    </button>
                                </form>

                                <form
                                    action={async () => {
                                        'use server'
                                        await signIn('credentials', {
                                            email: 'artist@demo.com',
                                            role: 'USER',
                                            redirectTo: '/dashboard'
                                        })
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-3 bg-emerald-600 rounded-xl px-6 py-4 text-white font-medium hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Login as Artist (User)
                                    </button>
                                </form>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-sm text-gray-500 text-center">
                                    🎭 <span className="font-medium">Demo Mode</span> - No real authentication required
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Production Mode - Google OAuth */}
                            <form
                                action={async () => {
                                    'use server'
                                    await signIn('google', { redirectTo: '/' })
                                }}
                            >
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-4 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Sign in with Google
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-sm text-gray-500 text-center">
                                    Only company accounts can access this application
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-indigo-100 text-sm mt-8">
                    © {new Date().getFullYear()} Image Foundry. All rights reserved.
                </p>
            </div>
        </div>
    )
}
