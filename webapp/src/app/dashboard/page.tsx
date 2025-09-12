import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/layout'
import { getUserAvailableModules } from '@/lib/module-access'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  if (!session.user.pwApiKey) {
    redirect('/setup/api-key')
  }

  // Check if user is an alliance admin
  const allianceAdmin = await prisma.allianceAdmin.findFirst({
    where: {
      discordId: session.user.discordId,
      isActive: true
    },
    include: {
      alliance: {
        include: {
          apiKey: true
        }
      }
    }
  })

  // If user is an alliance admin but alliance has no API key, redirect to setup
  if (allianceAdmin && !allianceAdmin.alliance.apiKey?.isActive) {
    redirect('/alliance/api-key')
  }

  // If user is an alliance admin with API key, redirect to their alliance dashboard
  if (allianceAdmin && allianceAdmin.alliance.apiKey?.isActive) {
    redirect(`/${allianceAdmin.allianceId}/dashboard`)
  }

  // Redirect to alliance-specific dashboard if user has an alliance
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
