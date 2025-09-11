'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { 
  Home, 
  Users, 
  Sword, 
  DollarSign, 
  BarChart3, 
  UserPlus, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  allianceId?: number
}

export function DashboardLayout({ children, allianceId }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Use allianceId from props or fallback to session
  const currentAllianceId = allianceId || session?.user?.currentAllianceId

  const navigation = [
    { name: 'Dashboard', href: `/${currentAllianceId}/dashboard`, icon: Home, current: true },
    { name: 'Member Management', href: `/${currentAllianceId}/modules/membership`, icon: Users, current: false },
    { name: 'War Management', href: `/${currentAllianceId}/modules/war`, icon: Sword, current: false },
    { name: 'Economic Tools', href: `/${currentAllianceId}/modules/banking`, icon: DollarSign, current: false },
    { name: 'Analytics', href: `/${currentAllianceId}/modules/analytics`, icon: BarChart3, current: false },
    { name: 'Recruitment', href: `/${currentAllianceId}/modules/recruitment`, icon: UserPlus, current: false },
    { name: 'Administration', href: '/admin/modules', icon: Settings, current: false },
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
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

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 cp-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-cp-border">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-cp-cyan mr-2" />
              <span className="text-lg font-bold font-cyberpunk text-cp-text-primary">
                P&W COMMAND
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-cp-text-secondary hover:text-cp-cyan"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`cp-sidebar-item ${item.current ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </a>
              )
            })}
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
              className="w-full cp-sidebar-item text-cp-red hover:text-cp-red hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navigation bar */}
        <div className="bg-cp-bg-secondary border-b border-cp-border lg:border-l">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-cp-text-secondary hover:text-cp-cyan"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-cp-green rounded-full animate-pulse"></div>
                  <span className="text-cp-text-secondary">System Online</span>
                </div>
              </div>
              
              <div className="text-sm text-cp-text-muted">
                {new Date().toLocaleString()}
              </div>
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
