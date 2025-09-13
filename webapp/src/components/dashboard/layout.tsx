'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { 
  Home, 
  Users, 
  Sword, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  DollarSign,
  Trophy,
  UserPlus,
  Bot,
  Target,
  UserCheck,
  Coins,
  BarChart3,
  MessageSquare
} from 'lucide-react'
import { GlobalHeader } from '@/components/ui/global-header'
import { MobileNavigation } from '@/components/ui/mobile-navigation'
import { ModuleQuickActions } from '@/components/ui/quick-actions'
import { ModuleStatus } from '@/components/ui/status-indicators'
import { useCurrentModule, getModuleIdFromName } from '@/hooks/useCurrentModule'

interface DashboardLayoutProps {
  children: React.ReactNode
  allianceId: number
  currentModule?: string
}

// Client-side only timestamp to avoid hydration mismatch
function ClientTimestamp() {
  const [timestamp, setTimestamp] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTimestamp = () => {
      setTimestamp(new Date().toLocaleString())
    }
    
    updateTimestamp()
    const interval = setInterval(updateTimestamp, 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <div className="text-sm text-cp-text-muted">Loading...</div>
  }

  return <div className="text-sm text-cp-text-muted">{timestamp}</div>
}

export function DashboardLayout({ children, allianceId, currentModule }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Use hook to detect current module from URL, fallback to prop
  const detectedModule = useCurrentModule()
  const currentModuleState = currentModule || detectedModule
  const currentModuleId = getModuleIdFromName(currentModuleState)

  // Use allianceId from props or fallback to session
  const currentAllianceId = allianceId || session?.user?.currentAllianceId

  // Enhanced navigation with categories and descriptions
  const coreNavigation = [
    { 
      id: 'dashboard',
      name: 'Dashboard', 
      href: `/${currentAllianceId}/dashboard`, 
      icon: Home, 
      description: 'Overview & status',
      current: currentModuleId === 'dashboard'
    }
  ]

  const moduleNavigation = [
    { 
      id: 'war',
      name: 'War Management', 
      href: `/${currentAllianceId}/modules/war`, 
      icon: Sword, 
      description: 'Manage conflicts & targets',
      current: currentModuleId === 'war',
      quickActions: [
        { icon: Target, label: 'Find Targets', href: `/${currentAllianceId}/modules/war/targets` },
        { icon: MessageSquare, label: 'War Alerts', href: `/${currentAllianceId}/modules/war/alerts` }
      ]
    },
    { 
      id: 'membership',
      name: 'Membership', 
      href: `/${currentAllianceId}/modules/membership`, 
      icon: Users, 
      description: 'Member roles & activity',
      current: currentModuleId === 'membership',
      quickActions: [
        { icon: UserPlus, label: 'Add Member', href: `/${currentAllianceId}/modules/membership/add` },
        { icon: UserCheck, label: 'Manage Roles', href: `/${currentAllianceId}/modules/membership/roles` }
      ]
    },
    { 
      id: 'economic',
      name: 'Economic Tools', 
      href: `/${currentAllianceId}/modules/economic-tools`, 
      icon: DollarSign, 
      description: 'Banking & finances',
      current: currentModuleId === 'economic',
      quickActions: [
        { icon: Coins, label: 'Bank Deposit', href: `/${currentAllianceId}/modules/economic-tools/bank/deposit` },
        { icon: BarChart3, label: 'Tax Reports', href: `/${currentAllianceId}/modules/economic-tools/taxes` }
      ]
    },
    { 
      id: 'quests',
      name: 'Quests', 
      href: `/${currentAllianceId}/modules/quests`, 
      icon: Trophy, 
      description: 'Member objectives',
      current: currentModuleId === 'quests',
      quickActions: [
        { icon: Trophy, label: 'Create Quest', href: `/${currentAllianceId}/modules/quests/create` },
        { icon: BarChart3, label: 'View Progress', href: `/${currentAllianceId}/modules/quests/progress` }
      ]
    },
    { 
      id: 'recruitment',
      name: 'Recruitment', 
      href: `/${currentAllianceId}/modules/recruitment`, 
      icon: UserPlus, 
      description: 'New member applications',
      current: currentModuleId === 'recruitment',
      quickActions: [
        { icon: UserPlus, label: 'Review Apps', href: `/${currentAllianceId}/modules/recruitment/applications` }
      ]
    },
    { 
      id: 'bot-management',
      name: 'Bot Management', 
      href: `/${currentAllianceId}/modules/bot-management`, 
      icon: Bot, 
      description: 'Discord bot settings',
      current: currentModuleId === 'bot-management',
      quickActions: [
        { icon: Settings, label: 'Bot Config', href: `/${currentAllianceId}/modules/bot-management/config` }
      ]
    }
  ]

  // Check if user is admin based on Discord ID
  const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || []
  const isAdmin = session?.user?.discordId ? adminIds.includes(session.user.discordId) : false

  const adminNavigation = isAdmin ? [
    { 
      id: 'admin-modules',
      name: 'Module Administration', 
      href: '/admin/modules', 
      icon: Settings, 
      description: 'Manage module access',
      current: currentModuleId === 'admin-modules'
    },
    { 
      id: 'admin-alliances',
      name: 'Alliance Management', 
      href: '/admin/alliances', 
      icon: Shield, 
      description: 'Alliance settings',
      current: currentModuleId === 'admin-alliances'
    }
  ] : []

  const handleModuleChange = (moduleId: string) => {
    // Navigation will be handled by the href, no state management needed
    // since we're using URL-based detection
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation 
        currentModule={currentModuleState}
        onModuleChange={handleModuleChange}
      />

      <div className="min-h-screen bg-cp-bg-primary">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black opacity-50"></div>
          </div>
        )}

        {/* Enhanced Desktop Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-cp-bg-secondary border-r border-cp-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 hidden lg:block
        `}>
          <div className="flex flex-col h-full">
            {/* Logo/Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-cp-border">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-cp-cyan mr-3" />
                <div>
                  <span className="text-lg font-bold font-cyberpunk text-cp-text-primary">
                    ORBIS TOOLKIT
                  </span>
                  <div className="text-xs text-cp-text-muted">Alliance Management</div>
                </div>
              </div>
            </div>

            {/* Alliance Context */}
            <div className="px-6 py-4 bg-cp-bg-tertiary border-b border-cp-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cp-cyan/20 rounded-lg border border-cp-cyan flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cp-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-cp-text-primary">
                    Alliance #{currentAllianceId}
                  </h3>
                  <p className="text-xs text-cp-text-muted">45 members • Active</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
              {/* Core Section */}
              <div>
                <h3 className="px-2 text-xs font-semibold text-cp-text-muted uppercase tracking-wider mb-3">
                  Core
                </h3>
                <div className="space-y-1">
                  {coreNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        onClick={() => handleModuleChange(item.id)}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                          ${item.current 
                            ? 'bg-cp-cyan/10 text-cp-cyan border border-cp-cyan shadow-cp-glow' 
                            : 'text-cp-text-primary hover:bg-cp-bg-tertiary hover:text-cp-cyan'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 mr-3 ${item.current ? 'text-cp-cyan' : 'text-cp-text-muted group-hover:text-cp-cyan'}`} />
                        <div className="flex-1">
                          <div>{item.name}</div>
                          <div className="text-xs text-cp-text-muted">{item.description}</div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>

              {/* Modules Section */}
              <div>
                <h3 className="px-2 text-xs font-semibold text-cp-text-muted uppercase tracking-wider mb-3">
                  Modules
                </h3>
                <div className="space-y-1">
                  {moduleNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.id} className="space-y-1">
                        <a
                          href={item.href}
                          onClick={() => handleModuleChange(item.id)}
                          className={`
                            group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                            ${item.current 
                              ? 'bg-cp-cyan/10 text-cp-cyan border border-cp-cyan shadow-cp-glow' 
                              : 'text-cp-text-primary hover:bg-cp-bg-tertiary hover:text-cp-cyan'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 mr-3 ${item.current ? 'text-cp-cyan' : 'text-cp-text-muted group-hover:text-cp-cyan'}`} />
                          <div className="flex-1">
                            <div>{item.name}</div>
                            <div className="text-xs text-cp-text-muted">{item.description}</div>
                          </div>
                        </a>
                        
                        {/* Quick Actions for Current Module */}
                        {item.current && item.quickActions && (
                          <div className="ml-8 space-y-1">
                            {item.quickActions.map((action, index) => {
                              const ActionIcon = action.icon
                              return (
                                <a
                                  key={index}
                                  href={action.href}
                                  className="flex items-center px-2 py-1 text-xs text-cp-text-muted hover:text-cp-cyan transition-colors"
                                >
                                  <ActionIcon className="w-3 h-3 mr-2" />
                                  {action.label}
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Admin Section */}
              {isAdmin && adminNavigation.length > 0 && (
                <div>
                  <h3 className="px-2 text-xs font-semibold text-cp-text-muted uppercase tracking-wider mb-3">
                    Administration
                  </h3>
                  <div className="space-y-1">
                    {adminNavigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          onClick={() => handleModuleChange(item.id)}
                          className={`
                            group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                            ${item.current 
                              ? 'bg-cp-cyan/10 text-cp-cyan border border-cp-cyan shadow-cp-glow' 
                              : 'text-cp-text-primary hover:bg-cp-bg-tertiary hover:text-cp-cyan'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 mr-3 ${item.current ? 'text-cp-cyan' : 'text-cp-text-muted group-hover:text-cp-cyan'}`} />
                          <div className="flex-1">
                            <div>{item.name}</div>
                            <div className="text-xs text-cp-text-muted">{item.description}</div>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </nav>

            {/* User info and logout */}
            <div className="border-t border-cp-border p-4">
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-cp-cyan/20 rounded border border-cp-cyan flex items-center justify-center mr-3">
                    <span className="text-cp-cyan text-sm font-bold">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cp-text-primary truncate">
                      {session?.user?.pwNationName || session?.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-cp-text-muted truncate">
                      {session?.user?.currentAllianceId ? `Alliance: ${session.user.currentAllianceId}` : 'No Alliance'}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-cp-red hover:text-cp-red hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:ml-72">
          {/* Global Header */}
          <GlobalHeader 
            currentModule={currentModuleState}
            allianceId={currentAllianceId}
          />

          {/* Page content */}
          <main className="p-6 pt-20 lg:pt-6">
            {children}
            
            {/* Quick Actions FAB - only show on non-dashboard pages */}
            {currentModuleId !== 'dashboard' && currentAllianceId && (
              <ModuleQuickActions 
                moduleType={currentModuleId as any}
                allianceId={currentAllianceId}
              />
            )}
          </main>
        </div>
      </div>
    </>
  )
}
