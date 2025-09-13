'use client'

import { useState, useEffect } from 'react'
import { Menu, X, ChevronLeft, ChevronRight, MoreHorizontal, Home } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface MobileNavigationProps {
  currentModule?: string
  onModuleChange?: (module: string) => void
  className?: string
}

export function MobileNavigation({ currentModule, onModuleChange, className = '' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('modules')
  const { data: session } = useSession()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [currentModule])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const modules = [
    { id: 'war', name: 'War Management', icon: '⚔️', color: 'text-cp-red', bgColor: 'bg-cp-red/20' },
    { id: 'membership', name: 'Membership', icon: '👥', color: 'text-cp-cyan', bgColor: 'bg-cp-cyan/20' },
    { id: 'economic', name: 'Economic', icon: '💰', color: 'text-cp-green', bgColor: 'bg-cp-green/20' },
    { id: 'quests', name: 'Quests', icon: '🏆', color: 'text-cp-yellow', bgColor: 'bg-cp-yellow/20' },
    { id: 'recruitment', name: 'Recruitment', icon: '📋', color: 'text-cp-purple', bgColor: 'bg-cp-purple/20' },
    { id: 'bot-management', name: 'Bot Management', icon: '🤖', color: 'text-cp-cyan', bgColor: 'bg-cp-cyan/20' }
  ]

  const quickActions = [
    { title: 'Find Targets', module: 'war', icon: '🎯' },
    { title: 'Add Member', module: 'membership', icon: '➕' },
    { title: 'Bank Deposit', module: 'economic', icon: '💳' },
    { title: 'Create Quest', module: 'quests', icon: '✨' },
    { title: 'Review Apps', module: 'recruitment', icon: '📝' },
    { title: 'Bot Config', module: 'bot-management', icon: '⚙️' }
  ]

  return (
    <>
      {/* Mobile Header Bar */}
      <div className={`
        lg:hidden fixed top-0 left-0 right-0 z-50
        bg-cp-bg-secondary/95 backdrop-blur-sm border-b border-cp-border
        px-4 py-3 flex items-center justify-between
        ${className}
      `}>
        {/* Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="
            p-2 rounded-lg bg-cp-bg-tertiary border border-cp-border
            hover:border-cp-cyan transition-colors
            text-cp-text-primary
          "
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Module */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-cp-text-primary">
            {currentModule || 'Dashboard'}
          </h1>
        </div>

        {/* Quick Action Button */}
        <button
          className="
            p-2 rounded-lg bg-cp-cyan/20 border border-cp-cyan
            text-cp-cyan hover:bg-cp-cyan hover:text-cp-bg-primary
            transition-all
          "
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Slide-out Menu */}
          <div className="
            w-80 bg-cp-bg-secondary border-l border-cp-border
            flex flex-col h-full overflow-hidden
            animate-slide-in-right
          ">
            {/* Header */}
            <div className="p-4 border-b border-cp-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cp-cyan/20 rounded-full flex items-center justify-center">
                  <span className="text-cp-cyan font-bold">OT</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-cp-text-primary">Orbis Toolkit</h2>
                  <p className="text-xs text-cp-text-muted">Alliance Management</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-cp-bg-tertiary transition-colors text-cp-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-cp-border">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`
                    flex-1 py-3 px-4 text-sm font-medium transition-colors
                    ${activeTab === 'modules' 
                      ? 'text-cp-cyan border-b-2 border-cp-cyan bg-cp-cyan/5' 
                      : 'text-cp-text-muted hover:text-cp-text-primary'
                    }
                  `}
                >
                  Modules
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`
                    flex-1 py-3 px-4 text-sm font-medium transition-colors
                    ${activeTab === 'actions' 
                      ? 'text-cp-cyan border-b-2 border-cp-cyan bg-cp-cyan/5' 
                      : 'text-cp-text-muted hover:text-cp-text-primary'
                    }
                  `}
                >
                  Quick Actions
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'modules' && (
                <div className="p-4 space-y-2">
                  {/* Dashboard */}
                  <button
                    onClick={() => {
                      onModuleChange?.('dashboard')
                      setIsOpen(false)
                    }}
                    className="
                      w-full p-4 rounded-lg bg-cp-bg-tertiary border border-cp-border
                      hover:border-cp-cyan hover:bg-cp-cyan/5 transition-all
                      flex items-center space-x-3 text-left
                    "
                  >
                    <div className="w-10 h-10 bg-cp-cyan/20 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5 text-cp-cyan" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-cp-text-primary">Dashboard</h3>
                      <p className="text-sm text-cp-text-muted">Overview & status</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cp-text-muted" />
                  </button>

                  {/* Modules */}
                  {modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => {
                        onModuleChange?.(module.id)
                        setIsOpen(false)
                      }}
                      className={`
                        w-full p-4 rounded-lg border transition-all text-left
                        flex items-center space-x-3
                        ${currentModule === module.id
                          ? 'border-cp-cyan bg-cp-cyan/10 shadow-cp-glow'
                          : 'border-cp-border bg-cp-bg-tertiary hover:border-cp-cyan hover:bg-cp-cyan/5'
                        }
                      `}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${module.bgColor}`}>
                        <span className="text-lg">{module.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${currentModule === module.id ? 'text-cp-cyan' : 'text-cp-text-primary'}`}>
                          {module.name}
                        </h3>
                        <p className="text-sm text-cp-text-muted">
                          {module.id === 'war' && 'Manage conflicts & targets'}
                          {module.id === 'membership' && 'Member roles & activity'}
                          {module.id === 'economic' && 'Banking & finances'}
                          {module.id === 'quests' && 'Member objectives'}
                          {module.id === 'recruitment' && 'New member applications'}
                          {module.id === 'bot-management' && 'Discord bot settings'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cp-text-muted" />
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="p-4 space-y-4">
                  <h3 className="text-sm font-medium text-cp-text-primary mb-3">Quick Actions</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => setIsOpen(false)}
                        className="
                          p-4 rounded-lg bg-cp-bg-tertiary border border-cp-border
                          hover:border-cp-cyan hover:bg-cp-cyan/5 transition-all
                          flex flex-col items-center space-y-2 text-center
                        "
                      >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-sm font-medium text-cp-text-primary">{action.title}</span>
                        <span className="text-xs text-cp-text-muted capitalize">{action.module}</span>
                      </button>
                    ))}
                  </div>

                  {/* User Profile Section */}
                  <div className="mt-6 pt-4 border-t border-cp-border">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-cp-bg-tertiary">
                      <div className="w-10 h-10 bg-cp-cyan/20 rounded-full flex items-center justify-center">
                        <span className="text-cp-cyan font-bold text-sm">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cp-text-primary">
                          {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-cp-text-muted">Alliance Member</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <button className="w-full py-2 px-3 text-left text-sm text-cp-text-primary hover:bg-cp-bg-tertiary rounded-lg transition-colors">
                        Profile Settings
                      </button>
                      <button className="w-full py-2 px-3 text-left text-sm text-cp-text-primary hover:bg-cp-bg-tertiary rounded-lg transition-colors">
                        Notifications
                      </button>
                      <button className="w-full py-2 px-3 text-left text-sm text-cp-red hover:bg-cp-bg-tertiary rounded-lg transition-colors">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-cp-bg-secondary/95 backdrop-blur-sm border-t border-cp-border">
        <div className="flex items-center justify-around py-2">
          {modules.slice(0, 4).map((module) => (
            <button
              key={module.id}
              onClick={() => onModuleChange?.(module.id)}
              className={`
                flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all
                ${currentModule === module.id
                  ? 'text-cp-cyan bg-cp-cyan/10'
                  : 'text-cp-text-muted hover:text-cp-text-primary'
                }
              `}
            >
              <span className="text-lg">{module.icon}</span>
              <span className="text-xs font-medium">{module.name.split(' ')[0]}</span>
            </button>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center space-y-1 py-2 px-3 rounded-lg text-cp-text-muted hover:text-cp-text-primary transition-all"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Add slide animation styles */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

interface MobileModuleHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
}

export function MobileModuleHeader({ title, subtitle, onBack, actions, className = '' }: MobileModuleHeaderProps) {
  return (
    <div className={`
      lg:hidden bg-cp-bg-secondary border-b border-cp-border
      px-4 py-4 flex items-center space-x-3
      ${className}
    `}>
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-cp-bg-tertiary transition-colors text-cp-text-primary"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      <div className="flex-1">
        <h1 className="text-lg font-bold text-cp-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-cp-text-muted">{subtitle}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  )
}

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, className = '' }: SwipeableCardProps) {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX - startX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const threshold = 100
    
    if (currentX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (currentX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    
    setCurrentX(0)
    setIsDragging(false)
  }

  return (
    <div
      className={`
        transform transition-transform duration-200 touch-pan-y
        ${className}
      `}
      style={{
        transform: isDragging ? `translateX(${currentX}px)` : 'translateX(0)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}