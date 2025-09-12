import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/layout'
import { checkModuleAccess } from '@/lib/module-access'
import { MembershipModule } from '@/components/modules/membership'
import { EconomicToolsModule } from '@/components/modules/economic'
import WarModule from '@/components/modules/war'

interface ModulePageProps {
  params: Promise<{
    allianceId: string
    moduleId: string
  }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const session = await getServerSession(authOptions)
  const { allianceId: allianceIdParam, moduleId } = await params
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

  // Check module access
  const access = await checkModuleAccess(moduleId)
  if (!access.hasAccess) {
    redirect(`/${allianceId}/dashboard`)
  }

  // Get module information
  const moduleNames = {
    'membership': 'Membership Management',
    'war': 'War Management',
    'banking': 'Banking & Economics',
    'economic': 'Economic Tools',
    'recruitment': 'Recruitment System',
    'quests': 'Quest & Achievement System'
  }

  const moduleIcons = {
    'membership': '👥',
    'war': '⚔️',
    'banking': '💰',
    'economic': '💼',
    'recruitment': '🎯',
    'quests': '🏆'
  }

  const moduleName = moduleNames[moduleId as keyof typeof moduleNames] || 'Unknown Module'
  const moduleIcon = moduleIcons[moduleId as keyof typeof moduleIcons] || '⚙️'

  // Render specific module content based on moduleId
  const renderModuleContent = () => {
    switch (moduleId) {
      case 'membership':
        return <MembershipModule allianceId={allianceId} />
      
      case 'economic':
        return <EconomicToolsModule allianceId={allianceId} />
      
      case 'war':
        return <WarModule />
      
      case 'banking':
      case 'recruitment':
      case 'quests':
      default:
        return (
          <div className="space-y-6">
            {/* Module Header */}
            <div className="cp-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-cp-cyan/20 rounded border border-cp-cyan flex items-center justify-center mr-4">
                  <span className="text-xl">{moduleIcon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary">
                    {moduleName}
                  </h1>
                  <p className="text-cp-text-secondary">
                    Alliance ID: {allianceId} • Module: {moduleId}
                  </p>
                </div>
              </div>
              <div className="border-t border-cp-border pt-4">
                <p className="text-cp-text-secondary">
                  Welcome to the {moduleName} module. This area will contain specific functionality for managing {moduleName.toLowerCase()} operations.
                </p>
              </div>
            </div>

            {/* Module Content */}
            <div className="cp-card p-6">
              <h2 className="text-xl font-cyberpunk text-cp-text-primary mb-4">
                Module Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <h3 className="text-lg font-semibold text-cp-text-primary mb-2">Feature 1</h3>
                  <p className="text-cp-text-secondary text-sm">
                    This is a placeholder for the first feature of the {moduleName} module.
                  </p>
                </div>
                
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <h3 className="text-lg font-semibold text-cp-text-primary mb-2">Feature 2</h3>
                  <p className="text-cp-text-secondary text-sm">
                    This is a placeholder for the second feature of the {moduleName} module.
                  </p>
                </div>
                
                <div className="cp-card p-4 bg-cp-bg-tertiary">
                  <h3 className="text-lg font-semibold text-cp-text-primary mb-2">Feature 3</h3>
                  <p className="text-cp-text-secondary text-sm">
                    This is a placeholder for the third feature of the {moduleName} module.
                  </p>
                </div>
              </div>
            </div>

            {/* Alliance-specific information */}
            <div className="cp-card p-4">
              <p className="text-cp-text-secondary text-sm">
                You are accessing the <span className="text-cp-cyan font-medium">{moduleName}</span> module 
                for alliance <span className="text-cp-cyan font-medium">#{allianceId}</span>
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <DashboardLayout allianceId={allianceId}>
      {renderModuleContent()}
    </DashboardLayout>
  )
}
