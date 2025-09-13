import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || []
    const isAdmin = adminIds.includes(session.user.discordId)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch Discord servers from database
    const discordServers = await prisma.discordServer.findMany({
      include: {
        alliance: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get channel configurations using raw query for compatibility
    const channelConfigs = await prisma.$queryRaw<Array<{
      server_id: string
      channel_id: string
      is_active: boolean
      settings: any
    }>>`
      SELECT server_id, channel_id, is_active, settings 
      FROM channel_configs 
      WHERE module = 'system-monitoring' 
        AND event_type = 'status-updates'
    `

    // Also get current Discord server info from the bot
    let liveServerData = []
    try {
      const botUrl = process.env.DISCORD_BOT_URL || 'http://localhost:3001'
      const response = await fetch(`${botUrl}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBAPP_API_SECRET}`
        },
        body: JSON.stringify({ message: 'Getting server info' })
      })

      if (response.ok) {
        const botData = await response.json()
        liveServerData = botData.servers || []
      }
    } catch (error) {
      console.error('Failed to fetch live Discord data:', error)
    }

    // Merge database and live data
    const servers = discordServers.map(server => {
      const liveData = liveServerData.find((ls: any) => ls.id === server.id)
      const statusChannelConfig = channelConfigs.find(cc => cc.server_id === server.id && cc.is_active)
      
      return {
        id: server.id,
        name: server.name || liveData?.name || 'Unknown Server',
        allianceId: server.allianceId,
        isActive: server.isActive,
        memberCount: liveData?.memberCount,
        statusChannelConfigured: !!statusChannelConfig,
        statusChannelName: statusChannelConfig?.settings ? 
          (statusChannelConfig.settings as any)?.channelName : undefined,
        enabledModules: server.enabledModules,
        joinedAt: liveData?.joinedAt
      }
    })

    // Add any live servers not in database
    liveServerData.forEach((liveServer: any) => {
      if (!servers.find(s => s.id === liveServer.id)) {
        servers.push({
          id: liveServer.id,
          name: liveServer.name,
          allianceId: null,
          isActive: true,
          memberCount: liveServer.memberCount,
          statusChannelConfigured: false,
          statusChannelName: undefined,
          enabledModules: [],
          joinedAt: liveServer.joinedAt
        })
      }
    })

    return NextResponse.json({
      success: true,
      servers: servers,
      summary: {
        total: servers.length,
        configured: servers.filter(s => s.statusChannelConfigured).length,
        active: servers.filter(s => s.isActive).length
      }
    })

  } catch (error) {
    console.error('Error fetching Discord servers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}