'use client'

import { useState, useEffect } from 'react'
import { Activity, Server, Database, Zap, CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Clock } from 'lucide-react'

interface StatusItem {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  responseTime?: number
  lastChecked: string
  details?: string
  uptime?: string
}

interface SystemStatus {
  webapp: StatusItem
  discordBot: StatusItem
  database: StatusItem
  pwApi: StatusItem
  modules: {
    war: StatusItem
    economic: StatusItem
    membership: StatusItem
    botManagement: StatusItem
    quests: StatusItem
  }
  lastUpdate: string
  nextUpdate: string
}

interface SystemStatusProps {
  allianceId?: number
}

export function SystemStatus({ allianceId }: SystemStatusProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchSystemStatus = async () => {
    try {
      setLoading(true)
      const queryParam = allianceId ? `?allianceId=${allianceId}` : ''
      const response = await fetch(`/api/system/status${queryParam}`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    } finally {
      setLoading(false)
    }
  }

  const publishToDiscord = async () => {
    try {
      const body = allianceId ? { allianceId } : {}
      await fetch('/api/system/publish-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    } catch (error) {
      console.error('Failed to publish status to Discord:', error)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemStatus, 30000) // Refresh every 30 seconds for UI
      return () => clearInterval(interval)
    }
  }, [autoRefresh, allianceId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-cp-green" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-cp-yellow" />
      case 'down':
        return <XCircle className="w-5 h-5 text-cp-red" />
      default:
        return <RefreshCw className="w-5 h-5 text-cp-text-muted animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-cp-green bg-cp-green/10'
      case 'degraded':
        return 'border-cp-yellow bg-cp-yellow/10'
      case 'down':
        return 'border-cp-red bg-cp-red/10'
      default:
        return 'border-cp-border bg-cp-bg-secondary'
    }
  }

  const StatusCard = ({ title, item, icon }: { title: string, item: StatusItem, icon: React.ReactNode }) => (
    <div className={`cp-card border-2 ${getStatusColor(item.status)} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {icon}
          <h3 className="text-lg font-semibold font-cyberpunk text-cp-text-primary ml-3">{title}</h3>
        </div>
        {getStatusIcon(item.status)}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-cp-text-secondary">Status:</span>
          <span className={`font-medium ${
            item.status === 'healthy' ? 'text-cp-green' :
            item.status === 'degraded' ? 'text-cp-yellow' :
            item.status === 'down' ? 'text-cp-red' : 'text-cp-text-muted'
          }`}>
            {item.status.toUpperCase()}
          </span>
        </div>
        
        {item.responseTime && (
          <div className="flex justify-between text-sm">
            <span className="text-cp-text-secondary">Response Time:</span>
            <span className="text-cp-text-primary">{item.responseTime}ms</span>
          </div>
        )}
        
        {item.uptime && (
          <div className="flex justify-between text-sm">
            <span className="text-cp-text-secondary">Uptime:</span>
            <span className="text-cp-text-primary">{item.uptime}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-cp-text-secondary">Last Checked:</span>
          <span className="text-cp-text-primary">{new Date(item.lastChecked).toLocaleTimeString()}</span>
        </div>
        
        {item.details && (
          <div className="mt-3 p-2 bg-cp-bg-primary rounded border border-cp-border">
            <p className="text-xs text-cp-text-secondary">{item.details}</p>
          </div>
        )}
      </div>
    </div>
  )

  if (loading && !status) {
    return (
      <div className="space-y-6">
        <div className="cp-card p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cp-cyan"></div>
            <span className="ml-4 text-cp-text-secondary">Loading system status...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="cp-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-cp-green/20 rounded border border-cp-green flex items-center justify-center mr-4">
              <Activity className="w-6 h-6 text-cp-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary">System Status</h1>
              <p className="text-cp-text-secondary">
                Real-time monitoring of all system components
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={publishToDiscord}
              className="cp-button flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Publish to Discord</span>
            </button>
            
            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="cp-button flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-cp-cyan mr-2" />
              <span className="text-cp-text-secondary">Last Update:</span>
              <span className="text-cp-text-primary ml-2">{new Date(status.lastUpdate).toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 text-cp-cyan mr-2" />
              <span className="text-cp-text-secondary">Next Auto-Update:</span>
              <span className="text-cp-text-primary ml-2">{new Date(status.nextUpdate).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center">
              <Activity className="w-4 h-4 text-cp-cyan mr-2" />
              <span className="text-cp-text-secondary">Auto-Refresh:</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  autoRefresh ? 'bg-cp-green text-cp-bg-primary' : 'bg-cp-bg-tertiary text-cp-text-secondary'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}
      </div>

      {status && (
        <>
          {/* Core Infrastructure */}
          <div>
            <h2 className="text-xl font-bold font-cyberpunk text-cp-text-primary mb-4 flex items-center">
              <Server className="w-5 h-5 text-cp-cyan mr-2" />
              Core Infrastructure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Web Application"
                item={status.webapp}
                icon={<Server className="w-5 h-5 text-cp-cyan" />}
              />
              <StatusCard
                title="Discord Bot"
                item={status.discordBot}
                icon={<Zap className="w-5 h-5 text-cp-purple" />}
              />
              <StatusCard
                title="Database"
                item={status.database}
                icon={<Database className="w-5 h-5 text-cp-orange" />}
              />
              <StatusCard
                title="P&W API"
                item={status.pwApi}
                icon={<ExternalLink className="w-5 h-5 text-cp-yellow" />}
              />
            </div>
          </div>

          {/* Module Status */}
          <div>
            <h2 className="text-xl font-bold font-cyberpunk text-cp-text-primary mb-4 flex items-center">
              <Activity className="w-5 h-5 text-cp-cyan mr-2" />
              Module Health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatusCard
                title="War Management"
                item={status.modules.war}
                icon={<span className="text-lg">⚔️</span>}
              />
              <StatusCard
                title="Economic Tools"
                item={status.modules.economic}
                icon={<span className="text-lg">💰</span>}
              />
              <StatusCard
                title="Membership"
                item={status.modules.membership}
                icon={<span className="text-lg">👥</span>}
              />
              <StatusCard
                title="Bot Management"
                item={status.modules.botManagement}
                icon={<span className="text-lg">🤖</span>}
              />
              <StatusCard
                title="Quest System"
                item={status.modules.quests}
                icon={<span className="text-lg">🎯</span>}
              />
            </div>
          </div>

          {/* Overall System Health Summary */}
          <div className="cp-card p-6">
            <h2 className="text-xl font-bold font-cyberpunk text-cp-text-primary mb-4">System Health Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-cp-green mb-2">
                  {Object.values(status.modules).filter(m => m.status === 'healthy').length + 
                   [status.webapp, status.discordBot, status.database, status.pwApi].filter(s => s.status === 'healthy').length}
                </div>
                <div className="text-cp-text-secondary">Healthy Components</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cp-yellow mb-2">
                  {Object.values(status.modules).filter(m => m.status === 'degraded').length + 
                   [status.webapp, status.discordBot, status.database, status.pwApi].filter(s => s.status === 'degraded').length}
                </div>
                <div className="text-cp-text-secondary">Degraded Components</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cp-red mb-2">
                  {Object.values(status.modules).filter(m => m.status === 'down').length + 
                   [status.webapp, status.discordBot, status.database, status.pwApi].filter(s => s.status === 'down').length}
                </div>
                <div className="text-cp-text-secondary">Down Components</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}