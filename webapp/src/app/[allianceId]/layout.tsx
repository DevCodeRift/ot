import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface AllianceLayoutProps {
  children: React.ReactNode
  params: Promise<{
    allianceId: string
  }>
}

export default async function AllianceLayout({ children, params }: AllianceLayoutProps) {
  const session = await getServerSession(authOptions)
  const { allianceId: allianceIdParam } = await params
  const allianceId = parseInt(allianceIdParam)
  
  // Basic authentication check
  if (!session) {
    redirect('/auth/signin')
  }
  
  if (!session.user.pwApiKey) {
    redirect('/setup/api-key')
  }

  // Verify user belongs to this alliance
  if (session.user.currentAllianceId !== allianceId) {
    // If user belongs to a different alliance, redirect to their alliance
    if (session.user.currentAllianceId) {
      redirect(`/${session.user.currentAllianceId}/dashboard`)
    } else {
      // If user has no alliance, redirect to main dashboard
      redirect('/dashboard')
    }
  }

  return <>{children}</>
}
