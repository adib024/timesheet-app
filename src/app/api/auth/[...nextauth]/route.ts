import { handlers } from '@/lib/auth'

// Force Node.js runtime — edge runtime causes session callback to fail silently
export const runtime = 'nodejs'

export const { GET, POST } = handlers
