import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/layout'
import { getUserAvailableModules } from '@/lib/module-access'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  if (!session.user.pwApiKey) {
    redirect('/setup/api-key')
  }

  // Redirect to alliance-specific dashboard
  if (session.user.currentAllianceId) {
    redirect(`/${session.user.currentAllianceId}/dashboard`)
  }

  // If user has no alliance, show error
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="cp-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cp-red/20 flex items-center justify-center">
            <span className="text-cp-red text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-cyberpunk text-cp-red mb-2">No Alliance Found</h3>
          <p className="text-cp-text-secondary">
            You are not currently in an alliance. Please join an alliance to access the dashboard.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
