'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bot, Settings, Users, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'

interface DiscordServer {
  id: string
  name: string
  allianceId?: number
  isActive: boolean
  memberCount?: number
  statusChannelConfigured: boolean
  statusChannelName?: string
  enabledModules: string[]
}

export default function DiscordServersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [servers, setServers] = useState<DiscordServer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(',') || []
    const isAdmin = session?.user?.discordId ? adminIds.includes(session.user.discordId) : false

    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchDiscordServers()
  }, [session, status, router])

  const fetchDiscordServers = async () => {
    try {
      const response = await fetch('/api/admin/discord-servers')
      if (response.ok) {
        const data = await response.json()
        setServers(data.servers || [])
      }
    } catch (error) {
      console.error('Failed to fetch Discord servers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="text-cp-text-primary">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout allianceId={session?.user?.currentAllianceId || 0} currentModule="discord-servers">
      <div className="space-y-6">
        <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-cp-text-primary">Discord Server Management</h1>
              <p className="text-cp-text-secondary mt-2">
                Configure status monitoring and bot settings for connected Discord servers.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-cp-text-secondary">
                Total Servers: <span className="text-cp-cyan font-medium">{servers.length}</span>
              </div>
              <div className="text-sm text-cp-text-secondary">
                Configured: <span className="text-cp-green font-medium">
                  {servers.filter(s => s.statusChannelConfigured).length}
                </span>
              </div>
            </div>
          </div>

          {servers.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-cp-text-muted mb-4" />
              <h3 className="text-lg font-medium text-cp-text-primary mb-2">No Discord Servers Found</h3>
              <p className="text-cp-text-secondary">
                The Discord bot is not connected to any servers yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="bg-cp-bg-tertiary border border-cp-border rounded-lg p-4 hover:border-cp-cyan transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-cp-bg-accent p-2 rounded-lg">
                        <Bot className="h-5 w-5 text-cp-cyan" />
                      </div>
                      <div>
                        <h3 className="font-medium text-cp-text-primary">{server.name}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-cp-text-secondary">
                            ID: {server.id}
                          </span>
                          {server.memberCount && (
                            <span className="text-sm text-cp-text-secondary">
                              <Users className="inline h-3 w-3 mr-1" />
                              {server.memberCount} members
                            </span>
                          )}
                          {server.allianceId && (
                            <span className="text-sm text-cp-text-secondary">
                              Alliance: {server.allianceId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {server.statusChannelConfigured ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-cp-green" />
                              <span className="text-sm font-medium text-cp-green">Status Channel Configured</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-cp-yellow" />
                              <span className="text-sm font-medium text-cp-yellow">Not Configured</span>
                            </>
                          )}
                        </div>
                        {server.statusChannelName && (
                          <div className="text-xs text-cp-text-secondary">
                            Channel: #{server.statusChannelName}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          server.isActive 
                            ? 'bg-cp-green/20 text-cp-green border border-cp-green/30' 
                            : 'bg-cp-red/20 text-cp-red border border-cp-red/30'
                        }`}>
                          {server.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-cp-border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-cp-text-secondary">
                        <span className="font-medium">Enabled Modules:</span>
                        {server.enabledModules.length > 0 ? (
                          <span className="ml-2">{server.enabledModules.join(', ')}</span>
                        ) : (
                          <span className="ml-2 text-cp-text-muted">None</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-cp-text-muted">
                        Use <code className="bg-cp-bg-primary px-1 py-0.5 rounded text-cp-cyan">
                          /setup-status-channel
                        </code> in Discord to configure
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-cp-border">
            <h3 className="text-lg font-medium text-cp-text-primary mb-4">Setup Instructions</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-cp-cyan">For Server Admins:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-cp-text-secondary">
                  <li>Run <code className="bg-cp-bg-primary px-1 py-0.5 rounded text-cp-cyan">/setup-status-channel</code> in your Discord server</li>
                  <li>Select the channel where you want status updates</li>
                  <li>Status updates will be published automatically every 30 minutes</li>
                  <li>Use <code className="bg-cp-bg-primary px-1 py-0.5 rounded text-cp-cyan">/status</code> to check current system status</li>
                </ol>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-cp-cyan">Requirements:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-cp-text-secondary">
                  <li>"Manage Channels" permission to configure status channel</li>
                  <li>Bot must have "Send Messages" permission in target channel</li>
                  <li>Bot must have "Embed Links" permission for rich status embeds</li>
                  <li>Alliance must be linked to Discord server for full monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}