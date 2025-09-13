'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Command, Bell, Settings, User, ChevronDown, Zap, Shield, Users, DollarSign, Target, Trophy, Bot } from 'lucide-react'
import { NotificationBadge } from './status-indicators'

interface GlobalHeaderProps {
  currentModule?: string
  allianceId?: number
  className?: string
}

export function GlobalHeader({ currentModule, allianceId, className = '' }: GlobalHeaderProps) {
  const { data: session } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Quick action commands for global search
  const quickCommands = [
    { 
      id: 'war-find-targets', 
      title: 'Find War Targets', 
      module: 'War Management',
      icon: Target,
      shortcut: 'W → T',
      action: () => window.location.href = '/war/targets'
    },
    { 
      id: 'member-add', 
      title: 'Add New Member', 
      module: 'Membership',
      icon: Users,
      shortcut: 'M → A',
      action: () => window.location.href = '/membership/add'
    },
    { 
      id: 'economic-deposit', 
      title: 'Bank Deposit', 
      module: 'Economic',
      icon: DollarSign,
      shortcut: 'E → D',
      action: () => window.location.href = '/economic/bank/deposit'
    },
    { 
      id: 'quest-create', 
      title: 'Create Quest', 
      module: 'Quests',
      icon: Trophy,
      shortcut: 'Q → C',
      action: () => window.location.href = '/quests/create'
    },
    { 
      id: 'bot-settings', 
      title: 'Bot Settings', 
      module: 'Bot Management',
      icon: Bot,
      shortcut: 'B → S',
      action: () => window.location.href = '/bot-management/settings'
    }
  ]

  // Filter commands based on search query
  const filteredCommands = quickCommands.filter(cmd =>
    cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.module.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Mock notifications
  const notifications = [
    { id: 1, type: 'war', title: 'New war declared', time: '2 min ago', unread: true },
    { id: 2, type: 'member', title: 'New member application', time: '15 min ago', unread: true },
    { id: 3, type: 'economic', title: 'Tax collection complete', time: '1 hour ago', unread: false },
    { id: 4, type: 'quest', title: 'Quest completed by 5 members', time: '2 hours ago', unread: false }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        setSearchOpen(false)
        setNotificationsOpen(false)
        setUserMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  return (
    <>
      <header className={`
        bg-cp-bg-secondary border-b border-cp-border 
        px-6 py-4 flex items-center justify-between
        sticky top-0 z-40 backdrop-blur-sm bg-cp-bg-secondary/95
        ${className}
      `}>
        {/* Left section - Breadcrumb & Search */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Current Module Indicator */}
          {currentModule && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-3 py-1 bg-cp-bg-tertiary rounded-lg border border-cp-border">
                {currentModule === 'War Management' && <Target className="w-4 h-4 text-cp-red" />}
                {currentModule === 'Membership' && <Users className="w-4 h-4 text-cp-cyan" />}
                {currentModule === 'Economic' && <DollarSign className="w-4 h-4 text-cp-green" />}
                {currentModule === 'Quests' && <Trophy className="w-4 h-4 text-cp-yellow" />}
                {currentModule === 'Bot Management' && <Bot className="w-4 h-4 text-cp-purple" />}
                <span className="text-sm font-medium text-cp-text-primary">{currentModule}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-cp-text-muted" />
            </div>
          )}

          {/* Global Search */}
          <div className="relative flex-1 max-w-md">
            {searchOpen ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cp-text-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search modules, actions, members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  className="
                    w-full pl-10 pr-4 py-2 bg-cp-bg-primary border border-cp-cyan 
                    text-cp-text-primary placeholder-cp-text-muted rounded-lg
                    focus:outline-none focus:border-cp-cyan focus:shadow-cp-glow
                  "
                />
                
                {/* Search Results Dropdown */}
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-cp-bg-secondary border border-cp-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {filteredCommands.length > 0 ? (
                      filteredCommands.map((cmd) => (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className="w-full px-4 py-3 text-left hover:bg-cp-bg-tertiary flex items-center space-x-3 transition-colors"
                        >
                          <cmd.icon className="w-4 h-4 text-cp-cyan" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-cp-text-primary">{cmd.title}</div>
                            <div className="text-xs text-cp-text-muted">{cmd.module}</div>
                          </div>
                          <div className="text-xs text-cp-text-muted bg-cp-bg-primary px-2 py-1 rounded">
                            {cmd.shortcut}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-cp-text-muted">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="
                  w-full px-4 py-2 bg-cp-bg-tertiary border border-cp-border rounded-lg
                  text-left text-cp-text-muted hover:border-cp-cyan transition-colors
                  flex items-center space-x-2
                "
              >
                <Search className="w-4 h-4" />
                <span>Search...</span>
                <div className="ml-auto flex items-center space-x-1 text-xs">
                  <kbd className="px-1 py-0.5 bg-cp-bg-primary rounded text-cp-text-muted">⌘</kbd>
                  <kbd className="px-1 py-0.5 bg-cp-bg-primary rounded text-cp-text-muted">K</kbd>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Right section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Command Palette Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="
              p-2 rounded-lg bg-cp-bg-tertiary border border-cp-border
              hover:border-cp-cyan hover:shadow-cp-glow transition-all
              text-cp-text-primary
            "
            title="Command Palette (⌘K)"
          >
            <Command className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="
                relative p-2 rounded-lg bg-cp-bg-tertiary border border-cp-border
                hover:border-cp-cyan hover:shadow-cp-glow transition-all
                text-cp-text-primary
              "
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <NotificationBadge 
                  count={unreadCount} 
                  className="absolute -top-1 -right-1"
                />
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-cp-bg-secondary border border-cp-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-cp-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-cp-text-primary">Notifications</h3>
                    <button className="text-xs text-cp-cyan hover:text-cp-cyan/80">
                      Mark all read
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 border-b border-cp-border last:border-b-0 hover:bg-cp-bg-tertiary
                        ${notification.unread ? 'bg-cp-cyan/5' : ''}
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-cp-cyan' : 'bg-cp-text-muted'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-cp-text-primary">{notification.title}</p>
                          <p className="text-xs text-cp-text-muted mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-cp-border">
                  <button className="w-full text-center text-sm text-cp-cyan hover:text-cp-cyan/80">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            className="
              p-2 rounded-lg bg-cp-bg-tertiary border border-cp-border
              hover:border-cp-cyan hover:shadow-cp-glow transition-all
              text-cp-text-primary
            "
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="
                flex items-center space-x-2 p-2 rounded-lg bg-cp-bg-tertiary border border-cp-border
                hover:border-cp-cyan hover:shadow-cp-glow transition-all
                text-cp-text-primary
              "
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{session?.user?.name || 'User'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-cp-bg-secondary border border-cp-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-cp-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-cp-cyan/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-cp-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cp-text-primary">{session?.user?.name}</p>
                      <p className="text-xs text-cp-text-muted">Alliance Member</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-cp-text-primary hover:bg-cp-bg-tertiary flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-cp-text-primary hover:bg-cp-bg-tertiary flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-cp-text-primary hover:bg-cp-bg-tertiary flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Security</span>
                  </button>
                </div>
                <div className="border-t border-cp-border py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-cp-red hover:bg-cp-bg-tertiary">
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl bg-cp-bg-secondary border border-cp-border rounded-lg shadow-2xl mx-4">
            <div className="p-4 border-b border-cp-border">
              <div className="relative">
                <Command className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cp-text-muted" />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="
                    w-full pl-10 pr-4 py-3 bg-transparent border-none text-lg
                    text-cp-text-primary placeholder-cp-text-muted
                    focus:outline-none
                  "
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action()
                    setCommandPaletteOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-cp-bg-tertiary flex items-center space-x-3 transition-colors"
                >
                  <cmd.icon className="w-5 h-5 text-cp-cyan" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cp-text-primary">{cmd.title}</div>
                    <div className="text-xs text-cp-text-muted">{cmd.module}</div>
                  </div>
                  <div className="text-xs text-cp-text-muted bg-cp-bg-primary px-2 py-1 rounded">
                    {cmd.shortcut}
                  </div>
                </button>
              ))}
              {filteredCommands.length === 0 && (
                <div className="px-4 py-8 text-center text-cp-text-muted">
                  <Command className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No commands found</p>
                  <p className="text-xs mt-1">Try typing a different search term</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-cp-border text-xs text-cp-text-muted flex items-center justify-between">
              <div>Use ↑↓ to navigate, ↵ to select, esc to close</div>
              <div className="flex items-center space-x-2">
                <span>Powered by</span>
                <Zap className="w-3 h-3 text-cp-cyan" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}