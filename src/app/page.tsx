import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    }
    // Redirect to dashboard if logged in
    redirect('/dashboard')
  }

  // Redirect to login if not logged in
  redirect('/login')
}
