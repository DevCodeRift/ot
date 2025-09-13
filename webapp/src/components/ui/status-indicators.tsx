'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, CheckCircle, Clock, Activity, Zap, Users, DollarSign } from 'lucide-react'

interface StatusIndicatorProps {
  type: 'success' | 'warning' | 'error' | 'info' | 'activity'
  children: React.ReactNode
  pulse?: boolean
  className?: string
}

export function StatusIndicator({ type, children, pulse = false, className = '' }: StatusIndicatorProps) {
  const colors = {
    success: 'text-cp-green',
    warning: 'text-cp-yellow',
    error: 'text-cp-red',
    info: 'text-cp-cyan',
    activity: 'text-cp-purple'
  }

  const bgColors = {
    success: 'bg-cp-green/20',
    warning: 'bg-cp-yellow/20',
    error: 'bg-cp-red/20',
    info: 'bg-cp-cyan/20',
    activity: 'bg-cp-purple/20'
  }

  return (
    <div className={`
      inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
      ${colors[type]} ${bgColors[type]} ${pulse ? 'animate-pulse' : ''} ${className}
    `}>
      {children}
    </div>
  )
}

interface ModuleStatusProps {
  moduleType: 'war' | 'membership' | 'economic' | 'quests' | 'recruitment' | 'bot-management'
  allianceId: number
  className?: string
}

export function ModuleStatus({ moduleType, allianceId, className = '' }: ModuleStatusProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching module status
    const fetchStatus = async () => {
      setLoading(true)
      
      // Mock status data - in real app, this would come from APIs
      const mockStatus = {
        war: {
          activeWars: 3,
          recentAlerts: 7,
          configuredChannels: 2,
          lastUpdate: new Date(),
          health: 'good'
        },
        membership: {
          totalMembers: 45,
          activeMembers: 42,
          pendingApplications: 3,
          lastRoleSync: new Date(),
          health: 'good'
        },
        economic: {
          bankBalance: 1250000,
          taxCollectionRate: 87,
          recentTransactions: 12,
          lastBankUpdate: new Date(),
          health: 'warning'
        },
        quests: {
          activeQuests: 8,
          completedToday: 15,
          membersParticipating: 28,
          lastQuestAssigned: new Date(),
          health: 'good'
        },
        recruitment: {
          pendingApplications: 3,
          approvedThisWeek: 5,
          rejectedThisWeek: 2,
          lastReview: new Date(),
          health: 'warning'
        },
        'bot-management': {
          connectedServers: 2,
          activeFeatures: 6,
          lastSync: new Date(),
          uptime: 99.8,
          health: 'good'
        }
      }

      setTimeout(() => {
        setStatus(mockStatus[moduleType])
        setLoading(false)
      }, 500)
    }

    fetchStatus()
  }, [moduleType, allianceId])

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-cp-bg-tertiary rounded w-3/4"></div>
          <div className="h-3 bg-cp-bg-tertiary rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const renderStatusContent = () => {
    switch (moduleType) {
      case 'war':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-cp-text-primary">War Module Status</h3>
              <StatusIndicator type={status.health === 'good' ? 'success' : 'warning'}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                {status.health === 'good' ? 'Operational' : 'Warning'}
              </StatusIndicator>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Zap className="w-4 h-4 mr-1 text-cp-yellow" />
                  {status.activeWars} Active Wars
                </div>
                <div className="flex items-center text-cp-text-secondary">
                  <Bell className="w-4 h-4 mr-1 text-cp-cyan" />
                  {status.recentAlerts} Recent Alerts
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Activity className="w-4 h-4 mr-1 text-cp-green" />
                  {status.configuredChannels} Channels
                </div>
                <div className="text-xs text-cp-text-muted">
                  Last update: {status.lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )

      case 'membership':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-cp-text-primary">Membership Status</h3>
              <StatusIndicator type="success">
                <div className="w-2 h-2 rounded-full bg-current"></div>
                Active
              </StatusIndicator>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Users className="w-4 h-4 mr-1 text-cp-cyan" />
                  {status.totalMembers} Members
                </div>
                <div className="flex items-center text-cp-text-secondary">
                  <Activity className="w-4 h-4 mr-1 text-cp-green" />
                  {status.activeMembers} Active
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Clock className="w-4 h-4 mr-1 text-cp-yellow" />
                  {status.pendingApplications} Pending
                </div>
                <div className="text-xs text-cp-text-muted">
                  Role sync: {status.lastRoleSync.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )

      case 'economic':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-cp-text-primary">Economic Status</h3>
              <StatusIndicator type={status.health === 'good' ? 'success' : 'warning'}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                {status.health === 'good' ? 'Healthy' : 'Attention'}
              </StatusIndicator>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <DollarSign className="w-4 h-4 mr-1 text-cp-green" />
                  ${status.bankBalance.toLocaleString()}
                </div>
                <div className="flex items-center text-cp-text-secondary">
                  <Activity className="w-4 h-4 mr-1 text-cp-cyan" />
                  {status.taxCollectionRate}% Tax Rate
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Zap className="w-4 h-4 mr-1 text-cp-purple" />
                  {status.recentTransactions} Transactions
                </div>
                <div className="text-xs text-cp-text-muted">
                  Bank: {status.lastBankUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )

      case 'quests':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-cp-text-primary">Quest System Status</h3>
              <StatusIndicator type="success">
                <div className="w-2 h-2 rounded-full bg-current"></div>
                Active
              </StatusIndicator>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Activity className="w-4 h-4 mr-1 text-cp-cyan" />
                  {status.activeQuests} Active Quests
                </div>
                <div className="flex items-center text-cp-text-secondary">
                  <CheckCircle className="w-4 h-4 mr-1 text-cp-green" />
                  {status.completedToday} Completed Today
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Users className="w-4 h-4 mr-1 text-cp-purple" />
                  {status.membersParticipating} Participating
                </div>
                <div className="text-xs text-cp-text-muted">
                  Last assigned: {status.lastQuestAssigned.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )

      case 'recruitment':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-cp-text-primary">Recruitment Status</h3>
              <StatusIndicator type={status.health === 'good' ? 'success' : 'warning'}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                {status.pendingApplications > 0 ? 'Pending Review' : 'Up to Date'}
              </StatusIndicator>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Clock className="w-4 h-4 mr-1 text-cp-yellow" />
                  {status.pendingApplications} Pending
                </div>
                <div className="flex items-center text-cp-text-secondary">
                  <CheckCircle className="w-4 h-4 mr-1 text-cp-green" />
                  {status.approvedThisWeek} Approved
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <AlertTriangle className="w-4 h-4 mr-1 text-cp-red" />
                  {status.rejectedThisWeek} Rejected
                </div>
                <div className="text-xs text-cp-text-muted">
                  Last review: {status.lastReview.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )

      case 'bot-management':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-cp-text-primary">Bot Status</h3>
              <StatusIndicator type="success" pulse>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                Online ({status.uptime}%)
              </StatusIndicator>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <Activity className="w-4 h-4 mr-1 text-cp-cyan" />
                  {status.connectedServers} Servers
                </div>
                <div className="flex items-center text-cp-text-secondary">
                  <Zap className="w-4 h-4 mr-1 text-cp-green" />
                  {status.activeFeatures} Features
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-cp-text-primary">
                  <CheckCircle className="w-4 h-4 mr-1 text-cp-green" />
                  Synchronized
                </div>
                <div className="text-xs text-cp-text-muted">
                  Last sync: {status.lastSync.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`bg-cp-bg-secondary border border-cp-border rounded-lg p-4 ${className}`}>
      {renderStatusContent()}
    </div>
  )
}

interface NotificationBadgeProps {
  count: number
  type?: 'default' | 'warning' | 'error'
  className?: string
}

export function NotificationBadge({ count, type = 'default', className = '' }: NotificationBadgeProps) {
  if (count === 0) return null

  const colors = {
    default: 'bg-cp-cyan text-cp-bg-primary',
    warning: 'bg-cp-yellow text-cp-bg-primary',
    error: 'bg-cp-red text-white'
  }

  return (
    <span className={`
      inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full
      ${colors[type]} ${className}
      ${count > 99 ? 'px-1' : ''}
    `}>
      {count > 99 ? '99+' : count}
    </span>
  )
}