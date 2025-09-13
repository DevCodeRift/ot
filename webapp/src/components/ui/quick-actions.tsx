'use client'

import { useState } from 'react'
import { Plus, X, Zap, Target, Users, Bell, DollarSign, FileText, Settings } from 'lucide-react'

interface QuickAction {
  id: string
  name: string
  description: string
  icon: any
  href?: string
  onClick?: () => void
  shortcut?: string
  category: 'primary' | 'secondary'
}

interface ModuleQuickActionsProps {
  moduleType: 'war' | 'membership' | 'economic' | 'quests' | 'recruitment' | 'bot-management'
  allianceId: number
  className?: string
}

export function ModuleQuickActions({ moduleType, allianceId, className = '' }: ModuleQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Only show quick actions for modules that benefit from them
  // Modules like membership already have comprehensive UIs
  const shouldShowActions = ['war', 'bot-management'].includes(moduleType)
  
  if (!shouldShowActions) {
    return null
  }

  const actionsByModule: Record<string, QuickAction[]> = {
    war: [
      {
        id: 'find-targets',
        name: 'Find Raid Targets',
        description: 'Search for optimal raid targets',
        icon: Target,
        href: `/${allianceId}/modules/war?tab=raid-finder&action=search`,
        shortcut: 'R',
        category: 'primary'
      },
      {
        id: 'setup-alerts',
        name: 'Configure War Alerts',
        description: 'Set up Discord war notifications',
        icon: Bell,
        href: `/${allianceId}/modules/war?tab=war-alerts`,
        shortcut: 'A',
        category: 'secondary'
      },
      {
        id: 'view-battles',
        name: 'Active Battles',
        description: 'View ongoing wars and battles',
        icon: Zap,
        href: `/${allianceId}/modules/war?tab=active-wars`,
        category: 'secondary'
      }
    ],
    membership: [
      {
        id: 'add-member',
        name: 'Add New Member',
        description: 'Register a new alliance member',
        icon: Users,
        href: `/${allianceId}/modules/membership?action=add-member`,
        shortcut: 'M',
        category: 'primary'
      },
      {
        id: 'assign-roles',
        name: 'Assign Roles',
        description: 'Manage member roles and permissions',
        icon: Settings,
        href: `/${allianceId}/modules/membership?tab=roles`,
        shortcut: 'R',
        category: 'primary'
      },
      {
        id: 'activity-report',
        name: 'Activity Report',
        description: 'Generate member activity reports',
        icon: FileText,
        href: `/${allianceId}/modules/membership?tab=activity&action=report`,
        category: 'secondary'
      },
      {
        id: 'discord-setup',
        name: 'Discord Notifications',
        description: 'Configure Discord notifications',
        icon: Bell,
        href: `/${allianceId}/modules/membership?tab=notifications`,
        category: 'secondary'
      }
    ],
    economic: [
      {
        id: 'quick-deposit',
        name: 'Quick Deposit',
        description: 'Make a quick resource deposit',
        icon: Plus,
        href: `/${allianceId}/modules/economic-tools?tab=holdings&action=deposit`,
        shortcut: 'D',
        category: 'primary'
      },
      {
        id: 'tax-management',
        name: 'Tax Management',
        description: 'Manage tax brackets and rates',
        icon: DollarSign,
        href: `/${allianceId}/modules/economic-tools?tab=tax-management`,
        shortcut: 'T',
        category: 'primary'
      },
      {
        id: 'bank-notifications',
        name: 'Bank Alerts',
        description: 'Set up banking notifications',
        icon: Bell,
        href: `/${allianceId}/modules/economic-tools?tab=notifications`,
        category: 'secondary'
      }
    ],
    quests: [
      {
        id: 'create-quest',
        name: 'Create Quest',
        description: 'Design a new quest or challenge',
        icon: Plus,
        href: `/${allianceId}/modules/quests?tab=quests&action=create`,
        shortcut: 'Q',
        category: 'primary'
      },
      {
        id: 'assign-quests',
        name: 'Assign Quests',
        description: 'Assign quests to members',
        icon: Target,
        href: `/${allianceId}/modules/quests?tab=assignments`,
        shortcut: 'A',
        category: 'primary'
      },
      {
        id: 'quest-notifications',
        name: 'Quest Notifications',
        description: 'Configure quest Discord alerts',
        icon: Bell,
        href: `/${allianceId}/modules/quests?tab=notifications`,
        category: 'secondary'
      }
    ],
    recruitment: [
      {
        id: 'review-applications',
        name: 'Review Applications',
        description: 'Process pending applications',
        icon: FileText,
        href: `/${allianceId}/modules/recruitment?action=review`,
        shortcut: 'R',
        category: 'primary'
      },
      {
        id: 'recruitment-notifications',
        name: 'Application Alerts',
        description: 'Set up recruitment notifications',
        icon: Bell,
        href: `/${allianceId}/modules/membership?tab=notifications`,
        category: 'secondary'
      }
    ],
    'bot-management': [
      {
        id: 'invite-bot',
        name: 'Invite Bot',
        description: 'Invite bot to new Discord server',
        icon: Plus,
        href: `/${allianceId}/modules/bot-management?action=invite`,
        shortcut: 'I',
        category: 'primary'
      },
      {
        id: 'configure-bot',
        name: 'Bot Settings',
        description: 'Configure bot permissions and features',
        icon: Settings,
        href: `/${allianceId}/modules/bot-management`,
        shortcut: 'S',
        category: 'primary'
      }
    ]
  }

  const actions = actionsByModule[moduleType] || []
  const primaryActions = actions.filter(a => a.category === 'primary')
  const secondaryActions = actions.filter(a => a.category === 'secondary')

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      window.location.href = action.href
    }
    setIsOpen(false)
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {/* Secondary actions (appear when FAB is open) */}
      {isOpen && secondaryActions.length > 0 && (
        <div className="mb-4 space-y-2">
          {secondaryActions.map((action, index) => {
            const Icon = action.icon
            return (
              <div
                key={action.id}
                className="flex items-center justify-end transform transition-all duration-300 ease-out"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: isOpen ? 'slideInRight 0.3s ease-out forwards' : undefined
                }}
              >
                <div className="mr-3 bg-cp-bg-secondary border border-cp-border rounded-lg px-3 py-2 shadow-lg opacity-0 animate-fadeIn">
                  <div className="text-sm font-medium text-cp-text-primary">{action.name}</div>
                  <div className="text-xs text-cp-text-muted">{action.description}</div>
                </div>
                <button
                  onClick={() => handleActionClick(action)}
                  className="w-12 h-12 bg-cp-bg-tertiary border border-cp-border rounded-full flex items-center justify-center text-cp-text-secondary hover:text-cp-cyan hover:border-cp-cyan transition-all duration-200 shadow-lg hover:shadow-cp-cyan/20"
                >
                  <Icon className="w-5 h-5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Primary actions (always visible when open) */}
      {isOpen && primaryActions.length > 0 && (
        <div className="mb-4 space-y-2">
          {primaryActions.map((action, index) => {
            const Icon = action.icon
            return (
              <div
                key={action.id}
                className="flex items-center justify-end transform transition-all duration-300 ease-out"
                style={{
                  animationDelay: `${(secondaryActions.length + index) * 50}ms`,
                  animation: isOpen ? 'slideInRight 0.3s ease-out forwards' : undefined
                }}
              >
                <div className="mr-3 bg-cp-bg-secondary border border-cp-cyan rounded-lg px-3 py-2 shadow-lg shadow-cp-cyan/20 opacity-0 animate-fadeIn">
                  <div className="text-sm font-medium text-cp-text-primary">{action.name}</div>
                  <div className="text-xs text-cp-text-muted">{action.description}</div>
                  {action.shortcut && (
                    <div className="mt-1">
                      <kbd className="px-1 py-0.5 text-xs bg-cp-bg-tertiary border border-cp-border rounded text-cp-text-muted">
                        {action.shortcut}
                      </kbd>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleActionClick(action)}
                  className="w-14 h-14 bg-gradient-to-br from-cp-cyan to-cp-purple rounded-full flex items-center justify-center text-cp-bg-primary hover:scale-110 transition-all duration-200 shadow-lg shadow-cp-cyan/30"
                >
                  <Icon className="w-6 h-6" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 bg-gradient-to-br from-cp-cyan to-cp-purple rounded-full flex items-center justify-center text-cp-bg-primary shadow-lg shadow-cp-cyan/30 hover:scale-110 transition-all duration-300 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out 0.2s forwards;
        }
      `}</style>
    </div>
  )
}

// Quick action bar for module headers
interface ModuleHeaderActionsProps {
  moduleType: 'war' | 'membership' | 'economic' | 'quests' | 'recruitment' | 'bot-management'
  allianceId: number
  className?: string
}

export function ModuleHeaderActions({ moduleType, allianceId, className = '' }: ModuleHeaderActionsProps) {
  const quickActionsByModule: Record<string, QuickAction[]> = {
    war: [
      {
        id: 'find-targets',
        name: 'Find Targets',
        description: 'Search for raid targets',
        icon: Target,
        href: `/${allianceId}/modules/war?tab=raid-finder&action=search`,
        category: 'primary'
      },
      {
        id: 'war-alerts',
        name: 'Alerts',
        description: 'Configure notifications',
        icon: Bell,
        href: `/${allianceId}/modules/war?tab=war-alerts`,
        category: 'primary'
      }
    ],
    membership: [
      {
        id: 'add-member',
        name: 'Add Member',
        description: 'Register new member',
        icon: Users,
        href: `/${allianceId}/modules/membership?action=add-member`,
        category: 'primary'
      },
      {
        id: 'assign-roles',
        name: 'Roles',
        description: 'Manage roles',
        icon: Settings,
        href: `/${allianceId}/modules/membership?tab=roles`,
        category: 'primary'
      }
    ],
    economic: [
      {
        id: 'quick-deposit',
        name: 'Deposit',
        description: 'Quick deposit',
        icon: Plus,
        href: `/${allianceId}/modules/economic-tools?tab=holdings&action=deposit`,
        category: 'primary'
      },
      {
        id: 'tax-management',
        name: 'Taxes',
        description: 'Manage tax brackets',
        icon: DollarSign,
        href: `/${allianceId}/modules/economic-tools?tab=tax-management`,
        category: 'primary'
      }
    ],
    quests: [
      {
        id: 'create-quest',
        name: 'Create Quest',
        description: 'New quest',
        icon: Plus,
        href: `/${allianceId}/modules/quests?tab=quests&action=create`,
        category: 'primary'
      },
      {
        id: 'assign-quests',
        name: 'Assign',
        description: 'Assign quests',
        icon: Target,
        href: `/${allianceId}/modules/quests?tab=assignments`,
        category: 'primary'
      }
    ],
    recruitment: [
      {
        id: 'review-applications',
        name: 'Review',
        description: 'Review applications',
        icon: FileText,
        href: `/${allianceId}/modules/recruitment?action=review`,
        category: 'primary'
      }
    ],
    'bot-management': [
      {
        id: 'invite-bot',
        name: 'Invite Bot',
        description: 'Add to server',
        icon: Plus,
        href: `/${allianceId}/modules/bot-management?action=invite`,
        category: 'primary'
      }
    ]
  }

  const actions = quickActionsByModule[moduleType] || []

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {actions.slice(0, 3).map((action) => {
        const Icon = action.icon
        return (
          <a
            key={action.id}
            href={action.href}
            className="group flex items-center space-x-2 px-4 py-2 bg-cp-bg-tertiary border border-cp-border rounded-lg hover:border-cp-cyan hover:shadow-lg hover:shadow-cp-cyan/20 transition-all duration-200"
          >
            <Icon className="w-4 h-4 text-cp-cyan group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-cp-text-primary group-hover:text-cp-cyan transition-colors">
              {action.name}
            </span>
          </a>
        )
      })}
    </div>
  )
}