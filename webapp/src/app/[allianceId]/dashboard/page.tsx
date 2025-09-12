import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/layout'
import { getUserAvailableModules } from '@/lib/module-access'
import Link from 'next/link'

interface DashboardPageProps {
  params: Promise<{
    allianceId: string
  }>
}

export default async function AllianceDashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions)
  const { allianceId: allianceIdParam } = await params
  const allianceId = parseInt(allianceIdParam)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  if (!session.user.pwApiKey) {
    redirect('/setup/api-key')
  }

  // Verify user belongs to this alliance
  if (session.user.currentAllianceId !== allianceId) {
    redirect(`/${session.user.currentAllianceId}/dashboard`)
  }

  // Get available modules for this alliance
  const { modules, user, error } = await getUserAvailableModules()

  const moduleColors = {
    'membership': 'cyan',
    'war': 'red'
  }

  const moduleIcons = {
    'membership': '👥',
    'war': '⚔️'
  }

  return (
    <DashboardLayout allianceId={allianceId}>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="cp-card p-6">
          <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary mb-2">
            Welcome back, {session.user.pwNationName || session.user.name}
          </h1>
          <p className="text-cp-text-secondary">
            Alliance Command Center - Manage your Politics & War alliance operations
          </p>
          <p className="text-cp-cyan text-sm mt-1">
            Alliance ID: {allianceId} • {user?.allianceName}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="cp-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cp-text-muted text-sm">Nation</p>
                <p className="text-cp-text-primary font-semibold">
                  {session.user.pwNationName || 'Unknown'}
                </p>
              </div>
              <div className="w-8 h-8 bg-cp-cyan/20 rounded border border-cp-cyan flex items-center justify-center">
                <span className="text-cp-cyan text-sm">🏴</span>
              </div>
            </div>
          </div>

          <div className="cp-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cp-text-muted text-sm">Alliance ID</p>
                <p className="text-cp-text-primary font-semibold">
                  {allianceId}
                </p>
              </div>
              <div className="w-8 h-8 bg-cp-green/20 rounded border border-cp-green flex items-center justify-center">
                <span className="text-cp-green text-sm">🏛️</span>
              </div>
            </div>
          </div>

          <div className="cp-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cp-text-muted text-sm">Status</p>
                <p className="text-cp-green font-semibold">Online</p>
              </div>
              <div className="w-8 h-8 bg-cp-green/20 rounded border border-cp-green flex items-center justify-center">
                <div className="w-2 h-2 bg-cp-green rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="cp-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cp-text-muted text-sm">API Status</p>
                <p className="text-cp-green font-semibold">Connected</p>
              </div>
              <div className="w-8 h-8 bg-cp-green/20 rounded border border-cp-green flex items-center justify-center">
                <span className="text-cp-green text-sm">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Available Modules */}
        <div className="space-y-4">
          <h2 className="text-xl font-cyberpunk text-cp-text-primary">Available Modules</h2>
          
          {error && (
            <div className="cp-card p-4 border-cp-red">
              <p className="text-cp-red">{error}</p>
            </div>
          )}

          {modules.length === 0 && !error && (
            <div className="cp-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cp-yellow/20 flex items-center justify-center">
                <span className="text-cp-yellow text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-cyberpunk text-cp-yellow mb-2">No Modules Available</h3>
              <p className="text-cp-text-secondary">
                Your alliance doesn't have access to any modules yet. 
                Contact an administrator to request access.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(module => {
              const color = moduleColors[module.category as keyof typeof moduleColors] || 'cyan'
              const icon = moduleIcons[module.category as keyof typeof moduleIcons] || '⚙️'
              
              return (
                <Link key={module.id} href={`/${allianceId}/modules/${module.id}`}>
                  <div className={`cp-card p-6 hover:border-cp-${color} transition-colors cursor-pointer`}>
                    <div className="flex items-center mb-3">
                      <div className={`w-8 h-8 bg-cp-${color}/20 rounded border border-cp-${color} flex items-center justify-center mr-3`}>
                        <span className="text-sm">{icon}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-cp-text-primary">{module.name}</h3>
                    </div>
                    <p className="text-cp-text-secondary text-sm mb-4">
                      {module.description}
                    </p>
                    <div className={`text-cp-${color} text-sm font-medium`}>
                      Available • Click to access
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Alliance Info */}
        {user?.allianceName && (
          <div className="cp-card p-4">
            <p className="text-cp-text-secondary text-sm">
              Modules available for <span className="text-cp-cyan font-medium">{user.allianceName}</span> alliance (ID: {allianceId})
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
