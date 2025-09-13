'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bot, Plus, ExternalLink, Settings, Users, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface DiscordServer {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
  botInvited: boolean
}

interface BotConnection {
  serverId: string
  serverName: string
  botStatus: 'online' | 'offline' | 'connecting'
  lastSync: string
  memberCount: number
  configuredModules: string[]
}

export default function BotManagementPage() {
  const { data: session } = useSession()
  const [discordServers, setDiscordServers] = useState<DiscordServer[]>([])
  const [botConnections, setBotConnections] = useState<BotConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  useEffect(() => {
    // Fetch Discord servers from API
    const fetchDiscordServers = async () => {
      try {
        console.log('Fetching Discord servers...')
        const response = await fetch('/api/bot/discord-servers')
        const data = await response.json()
        
        console.log('Discord servers response:', data)
        
        if (data.success) {
          setDiscordServers(data.servers)
        } else {
          console.error('Failed to fetch Discord servers:', data.error)
          setDiscordServers([]) // Clear any existing servers
        }
      } catch (error) {
        console.error('Error fetching Discord servers:', error)
        setDiscordServers([])
      } finally {
        setLoading(false)
      }
    }
              botInvited: false
            },
            {
              id: '876543210987654321',
              name: 'Alliance War Room',
              icon: null,
              owner: false,
              permissions: '8',
              botInvited: false
            }
          ]
          setDiscordServers(mockServers)
        }
      } catch (error) {
        console.error('Error fetching Discord servers:', error)
        // Fallback to mock data on error
        const mockServers: DiscordServer[] = [
          {
            id: '123456789012345678',
            name: 'Rose Alliance Discord',
            icon: null,
            owner: true,
            permissions: '8',
            botInvited: false
          }
        ]
        setDiscordServers(mockServers)
      }
    }

    fetchDiscordServers()

    // Mock bot connections for now
    const mockConnections: BotConnection[] = [
      {
        serverId: '123456789012345678',
        serverName: 'Rose Alliance Discord',
        botStatus: 'online',
        lastSync: '2 minutes ago',
        memberCount: 156,
        configuredModules: ['membership', 'war', 'quests']
      }
    ]

    setTimeout(() => {
      setBotConnections(mockConnections)
      setLoading(false)
    }, 1000)
  }, [])

  const handleInviteBot = async (serverId: string) => {
    try {
      // Get bot invite URL from API
      const response = await fetch('/api/bot/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Open Discord invite in new tab
        window.open(data.inviteUrl, '_blank')
      } else {
        alert(`❌ Failed to generate invite: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating bot invite:', error)
      alert(`❌ Error generating invite: ${error}`)
    }
  }

  const handleTestConnection = async (serverId: string) => {
    setTestingConnection(serverId)
    
    try {
      // Make API call to test bot connection
      const response = await fetch('/api/bot/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          message: 'Testing connection from webapp'
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Bot connection successful!\n\nStatus: ${result.botStatus}\nServers: ${result.serverCount}\nTime: ${result.timestamp}`)
      } else {
        alert(`❌ Connection failed: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ Connection test failed: ${error}`)
    } finally {
      setTestingConnection(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cp-bg-primary p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cp-cyan"></div>
            <span className="ml-4 text-cp-text-secondary">Loading Discord servers...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cp-bg-primary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Bot className="w-8 h-8 text-cp-cyan mr-3" />
            <h1 className="text-3xl font-bold font-cyberpunk text-cp-text-primary">Bot Management</h1>
          </div>
          <p className="text-cp-text-secondary">
            Manage Discord bot integrations for your alliance servers. Invite the bot to Discord servers where you have admin permissions.
          </p>
        </div>

        {/* Active Bot Connections */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold font-cyberpunk text-cp-text-primary mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-cp-green mr-2" />
            Active Bot Connections
          </h2>
          
          {botConnections.length === 0 ? (
            <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
              <div className="text-center">
                <Bot className="w-12 h-12 text-cp-text-muted mx-auto mb-4" />
                <p className="text-cp-text-secondary">No active bot connections found.</p>
                <p className="text-cp-text-muted text-sm">Invite the bot to your Discord servers below to get started.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {botConnections.map((connection) => (
                <div key={connection.serverId} className="bg-cp-bg-secondary border border-cp-border rounded-lg p-4 hover:border-cp-cyan transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-cp-text-primary truncate">{connection.serverName}</h3>
                    <div className={`flex items-center text-xs px-2 py-1 rounded ${
                      connection.botStatus === 'online' ? 'bg-cp-green/20 text-cp-green' :
                      connection.botStatus === 'offline' ? 'bg-cp-red/20 text-cp-red' :
                      'bg-cp-yellow/20 text-cp-yellow'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        connection.botStatus === 'online' ? 'bg-cp-green' :
                        connection.botStatus === 'offline' ? 'bg-cp-red' :
                        'bg-cp-yellow'
                      }`}></div>
                      {connection.botStatus}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-cp-text-secondary">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {connection.memberCount} members
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Last sync: {connection.lastSync}
                    </div>
                    <div className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      {connection.configuredModules.length} modules configured
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cp-border">
                    <button
                      onClick={() => handleTestConnection(connection.serverId)}
                      disabled={testingConnection === connection.serverId}
                      className="w-full px-3 py-2 bg-cp-cyan/10 text-cp-cyan border border-cp-cyan rounded-md hover:bg-cp-cyan hover:text-cp-bg-primary transition-colors disabled:opacity-50 text-sm"
                    >
                      {testingConnection === connection.serverId ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cp-cyan mr-2"></div>
                          Testing...
                        </div>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 inline mr-2" />
                          Test Connection
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Discord Servers */}
        <div>
          <h2 className="text-xl font-semibold font-cyberpunk text-cp-text-primary mb-4 flex items-center">
            <Plus className="w-5 h-5 text-cp-cyan mr-2" />
            Available Discord Servers
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {discordServers.map((server) => (
              <div key={server.id} className="bg-cp-bg-secondary border border-cp-border rounded-lg p-4 hover:border-cp-cyan transition-colors">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-cp-cyan/20 rounded-full flex items-center justify-center mr-3">
                    {server.icon ? (
                      <img src={server.icon} alt={server.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-cp-cyan font-bold text-lg">
                        {server.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-cp-text-primary truncate">{server.name}</h3>
                    <p className="text-xs text-cp-text-muted">
                      {server.owner ? 'Owner' : 'Administrator'}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  {server.botInvited ? (
                    <div className="flex items-center text-sm text-cp-green">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Bot already invited
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-cp-text-muted">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Bot not invited
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleInviteBot(server.id)}
                  disabled={server.botInvited}
                  className={`w-full px-4 py-2 rounded-md transition-colors text-sm ${
                    server.botInvited
                      ? 'bg-cp-bg-tertiary text-cp-text-muted cursor-not-allowed'
                      : 'bg-cp-cyan/10 text-cp-cyan border border-cp-cyan hover:bg-cp-cyan hover:text-cp-bg-primary'
                  }`}
                >
                  {server.botInvited ? (
                    'Already Invited'
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 inline mr-2" />
                      Invite Bot
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bot Information */}
        <div className="mt-8 bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
          <h3 className="text-lg font-semibold font-cyberpunk text-cp-text-primary mb-4">
            Bot Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-cp-text-primary mb-2">Required Permissions</h4>
              <ul className="text-sm text-cp-text-secondary space-y-1">
                <li>• View Channels</li>
                <li>• Send Messages</li>
                <li>• Use Slash Commands</li>
                <li>• Manage Messages</li>
                <li>• Embed Links</li>
                <li>• Read Message History</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-cp-text-primary mb-2">Bot Features</h4>
              <ul className="text-sm text-cp-text-secondary space-y-1">
                <li>• Alliance member management</li>
                <li>• War coordination commands</li>
                <li>• Quest assignment tracking</li>
                <li>• Economic monitoring</li>
                <li>• Real-time sync with webapp</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}