'use client'

import { useSession } from 'next-auth/react'

export default function DebugSession() {
    const { data: session, status } = useSession()

    if (status === 'loading') return <div>Loading...</div>

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
            <div className="bg-gray-100 p-4 rounded overflow-auto">
                <pre>{JSON.stringify(session, null, 2)}</pre>
            </div>
            <div className="mt-4">
                <p>Status: {status}</p>
            </div>
        </div>
    )
}
