import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error('Root page: auth() check failed, redirecting to login:', error)
  }

  if (session?.user) {
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    }
    redirect('/dashboard')
  }

  // Redirect to login if not logged in or auth failed
  redirect('/login')
}
