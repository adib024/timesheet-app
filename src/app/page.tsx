import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  try {
    const session = await auth()

    if (session?.user) {
      if (session.user.role === 'ADMIN') {
        redirect('/admin')
      }
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('Root page: auth() check failed, redirecting to login:', error)
  }

  // Redirect to login if not logged in or auth failed
  redirect('/login')
}
