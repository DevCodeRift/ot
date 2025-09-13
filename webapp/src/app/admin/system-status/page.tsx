'use client'

import { DashboardLayout } from '@/components/dashboard/layout'
import { SystemStatus } from '@/components/ui/system-status'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SystemStatusPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(',') || []
    const isAdmin = session?.user?.discordId ? adminIds.includes(session.user.discordId) : false

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="text-cp-text-primary">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout allianceId={session?.user?.currentAllianceId || 0} currentModule="system-status">
      <div className="space-y-6">
        <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-cp-text-primary">System Status Monitor</h1>
              <p className="text-cp-text-secondary mt-2">
                Real-time monitoring of all system components, modules, and services.
                Status updates are automatically published to Discord every 30 minutes.
              </p>
            </div>
          </div>
          
          <SystemStatus />
        </div>
      </div>
    </DashboardLayout>
  )
}