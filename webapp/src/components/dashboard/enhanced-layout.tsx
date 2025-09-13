'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
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
  Bell,
  Search,
  ChevronRight,
  Activity,
  Zap,
  Target,
  BarChart3,
  Globe,
  MessageSquare
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  allianceId: number
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  current: boolean
  category: 'core' | 'modules' | 'admin'
  description?: string
  badge?: string | number
  quickActions?: { name: string; href: string; icon: any }[]
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

export function DashboardLayout({ children, allianceId }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const pathname = usePathname()

  // Use allianceId from props or fallback to session
  const currentAllianceId = allianceId || session?.user?.currentAllianceId

  // Check if user is admin based on Discord ID
  const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || []
  const isAdmin = session?.user?.discordId ? adminIds.includes(session.user.discordId) : false

  const navigation: NavigationItem[] = [
    // Core navigation
    { 
      name: 'Dashboard', 
      href: `/${currentAllianceId}/dashboard`, 
      icon: Home, 
      current: pathname === `/${currentAllianceId}/dashboard`,
      category: 'core',
      description: 'Overview & quick stats'
    },
    
    // Module navigation with enhanced details
    { 
      name: 'Membership', 
      href: `/${currentAllianceId}/modules/membership`, 
      icon: Users, 
      current: pathname.includes('/modules/membership'),
      category: 'modules',
      description: 'Member management & roles',
      quickActions: [
        { name: 'View Members', href: `/${currentAllianceId}/modules/membership`, icon: Users },
        { name: 'Assign Roles', href: `/${currentAllianceId}/modules/membership?tab=roles`, icon: Shield },
        { name: 'Activity Report', href: `/${currentAllianceId}/modules/membership?tab=activity`, icon: Activity }
      ]
    },
    { 
      name: 'War Management', 
      href: `/${currentAllianceId}/modules/war`, 
      icon: Sword, 
      current: pathname.includes('/modules/war'),
      category: 'modules',
      description: 'Combat operations & alerts',
      badge: 'New',
      quickActions: [
        { name: 'Raid Finder', href: `/${currentAllianceId}/modules/war`, icon: Target },
        { name: 'War Alerts', href: `/${currentAllianceId}/modules/war?tab=war-alerts`, icon: Bell },
        { name: 'Battle Stats', href: `/${currentAllianceId}/modules/war?tab=stats`, icon: BarChart3 }
      ]
    },
    { 
      name: 'Economics', 
      href: `/${currentAllianceId}/modules/economic-tools`, 
      icon: DollarSign, 
      current: pathname.includes('/modules/economic'),
      category: 'modules',
      description: 'Banking & tax management',
      quickActions: [
        { name: 'Tax Brackets', href: `/${currentAllianceId}/modules/economic-tools`, icon: DollarSign },
        { name: 'Holdings', href: `/${currentAllianceId}/modules/economic-tools?tab=holdings`, icon: Globe },
        { name: 'Discord Setup', href: `/${currentAllianceId}/modules/economic-tools?tab=notifications`, icon: MessageSquare }
      ]
    },
    { 
      name: 'Quests & Gamification', 
      href: `/${currentAllianceId}/modules/quests`, 
      icon: Trophy, 
      current: pathname.includes('/modules/quests'),
      category: 'modules',
      description: 'Achievement system',
      quickActions: [
        { name: 'Quest Overview', href: `/${currentAllianceId}/modules/quests`, icon: Trophy },
        { name: 'Create Quest', href: `/${currentAllianceId}/modules/quests?tab=quests&action=create`, icon: Zap },
        { name: 'Assignments', href: `/${currentAllianceId}/modules/quests?tab=assignments`, icon: UserPlus }
      ]
    },
    { 
      name: 'Recruitment', 
      href: `/${currentAllianceId}/modules/recruitment`, 
      icon: UserPlus, 
      current: pathname.includes('/modules/recruitment'),
      category: 'modules',
      description: 'Application management',
      quickActions: [
        { name: 'Applications', href: `/${currentAllianceId}/modules/recruitment`, icon: UserPlus },
        { name: 'Discord Setup', href: `/${currentAllianceId}/modules/membership?tab=notifications`, icon: MessageSquare }
      ]
    },
    { 
      name: 'Bot Management', 
      href: `/${currentAllianceId}/modules/bot-management`, 
      icon: Bot, 
      current: pathname.includes('/modules/bot-management'),
      category: 'modules',
      description: 'Discord bot configuration',
      quickActions: [
        { name: 'Server Settings', href: `/${currentAllianceId}/modules/bot-management`, icon: Settings },
        { name: 'Invite Bot', href: `/${currentAllianceId}/modules/bot-management?action=invite`, icon: Bot }
      ]
    },
  ]

  // Add admin navigation if user is admin
  if (isAdmin) {
    navigation.push(
      { 
        name: 'Module Administration', 
        href: '/admin/modules', 
        icon: Settings, 
        current: pathname === '/admin/modules',
        category: 'admin',
        description: 'System module management'
      },
      { 
        name: 'Alliance Management', 
        href: '/admin/alliances', 
        icon: Shield, 
        current: pathname === '/admin/alliances',
        category: 'admin',
        description: 'Alliance administration'
      }
    )
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const toggleModuleExpanded = (moduleName: string) => {
    setExpandedModule(expandedModule === moduleName ? null : moduleName)
  }

  const groupedNavigation = {
    core: navigation.filter(item => item.category === 'core'),
    modules: navigation.filter(item => item.category === 'modules'),
    admin: navigation.filter(item => item.category === 'admin')
  }

  return (
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

      {/* Enhanced Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 cp-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header with search */}
          <div className="px-4 py-4 border-b border-cp-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-cp-cyan mr-2" />
                <span className="text-lg font-bold font-cyberpunk text-cp-text-primary">
                  P&W COMMAND
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-cp-text-secondary hover:text-cp-cyan transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Alliance context */}
            <div className="bg-cp-bg-tertiary rounded-lg p-3 border border-cp-border">
              <div className="flex items-center text-sm">
                <Shield className="w-4 h-4 text-cp-cyan mr-2" />
                <div>
                  <div className="text-cp-text-primary font-medium">Alliance {currentAllianceId}</div>
                  <div className="text-cp-text-muted">Command Center</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
            {/* Core Navigation */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-cp-text-muted uppercase tracking-wider mb-2">
                Core
              </h3>
              <div className="space-y-1">
                {groupedNavigation.core.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`cp-sidebar-item group ${item.current ? 'active' : ''}`}
                    >
                      <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <p className="text-xs text-cp-text-muted mt-0.5">{item.description}</p>
                        )}
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 text-xs bg-cp-cyan text-cp-bg-primary rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Module Navigation */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-cp-text-muted uppercase tracking-wider mb-2">
                Modules
              </h3>
              <div className="space-y-1">
                {groupedNavigation.modules.map((item) => {
                  const Icon = item.icon
                  const isExpanded = expandedModule === item.name
                  
                  return (
                    <div key={item.name}>
                      <div
                        className={`cp-sidebar-item group ${item.current ? 'active' : ''} cursor-pointer`}
                        onClick={() => window.location.href = item.href}
                      >
                        <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <p className="text-xs text-cp-text-muted mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.badge && (
                            <span className="px-2 py-1 text-xs bg-cp-cyan text-cp-bg-primary rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {item.quickActions && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleModuleExpanded(item.name)
                              }}
                              className="p-1 hover:bg-cp-bg-accent rounded transition-colors"
                            >
                              <ChevronRight 
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                              />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Actions Submenu */}
                      {isExpanded && item.quickActions && (
                        <div className="ml-8 mt-1 space-y-1 border-l border-cp-border pl-3">
                          {item.quickActions.map((action) => {
                            const ActionIcon = action.icon
                            return (
                              <a
                                key={action.name}
                                href={action.href}
                                className="flex items-center px-3 py-2 text-sm text-cp-text-secondary hover:text-cp-cyan hover:bg-cp-bg-accent rounded transition-colors"
                              >
                                <ActionIcon className="w-4 h-4 mr-2" />
                                {action.name}
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

            {/* Admin Navigation */}
            {groupedNavigation.admin.length > 0 && (
              <div>
                <h3 className="px-3 text-xs font-semibold text-cp-text-muted uppercase tracking-wider mb-2">
                  Administration
                </h3>
                <div className="space-y-1">
                  {groupedNavigation.admin.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={`cp-sidebar-item group ${item.current ? 'active' : ''}`}
                      >
                        <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <p className="text-xs text-cp-text-muted mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* Enhanced User info and logout */}
          <div className="border-t border-cp-border p-4">
            <div className="mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-cp-cyan to-cp-purple rounded-lg border border-cp-cyan flex items-center justify-center mr-3 shadow-lg shadow-cp-cyan/20">
                  <span className="text-cp-bg-primary text-sm font-bold">
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
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-cp-green rounded-full mr-1"></div>
                    <span className="text-xs text-cp-green">Online</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full cp-sidebar-item text-cp-red hover:text-cp-red hover:bg-red-900/20 group"
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Enhanced Top navigation bar */}
        <div className="bg-cp-bg-secondary border-b border-cp-border lg:border-l">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-cp-text-secondary hover:text-cp-cyan transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Breadcrumb */}
              <nav className="hidden md:flex items-center space-x-2 text-sm">
                <span className="text-cp-text-muted">Alliance {currentAllianceId}</span>
                <ChevronRight className="w-4 h-4 text-cp-text-muted" />
                <span className="text-cp-text-primary">
                  {pathname.includes('/dashboard') ? 'Dashboard' : 
                   pathname.includes('/modules/membership') ? 'Membership Management' :
                   pathname.includes('/modules/war') ? 'War Management' :
                   pathname.includes('/modules/economic') ? 'Economic Tools' :
                   pathname.includes('/modules/quests') ? 'Quests & Gamification' :
                   pathname.includes('/modules/recruitment') ? 'Recruitment' :
                   pathname.includes('/modules/bot-management') ? 'Bot Management' :
                   pathname.includes('/admin') ? 'Administration' : 'Unknown'}
                </span>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick search */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-cp-text-muted" />
                  <input
                    type="text"
                    placeholder="Quick search..."
                    className="bg-cp-bg-tertiary border border-cp-border rounded-lg pl-10 pr-4 py-2 text-sm text-cp-text-primary placeholder-cp-text-muted focus:border-cp-cyan focus:ring-1 focus:ring-cp-cyan"
                  />
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-cp-green rounded-full animate-pulse"></div>
                <span className="text-cp-text-secondary hidden sm:inline">System Online</span>
              </div>
              
              <ClientTimestamp />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}