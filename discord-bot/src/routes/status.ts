import express from 'express'
import { PrismaClient } from '@prisma/client'
import { Client } from 'discord.js'

const router = express.Router()
const prisma = new PrismaClient()

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const uptime = process.uptime()
    const memUsage = process.memoryUsage()
    
    // Check Discord client status
    const { client } = await import('../index')
    const clientStatus = client?.isReady() ? 'connected' : 'disconnected'
    const guildCount = client?.guilds.cache.size || 0
    
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`
    
    res.json({
      status: 'ok',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      uptimeSeconds: Math.floor(uptime),
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
      },
      discord: {
        status: clientStatus,
        guilds: guildCount,
        ping: client?.ws.ping || -1
      },
      database: 'connected',
      details: 'All systems operational'
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown error',
      uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`
    })
  }
})

// Status publisher endpoint
router.post('/publish-status', async (req, res) => {
  try {
    const { allianceId, systemStatus, requestedBy } = req.body

    if (!allianceId || !systemStatus) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get Discord servers for this alliance with status channels configured
    const servers = await prisma.discordServer.findMany({
      where: {
        allianceId: parseInt(allianceId),
        isActive: true
      },
      include: {
        alliance: true
      }
    })

    if (servers.length === 0) {
      return res.status(404).json({ error: 'No Discord servers found for this alliance' })
    }

    const { client } = await import('../index')
    if (!client || !client.isReady()) {
      return res.status(503).json({ error: 'Discord bot is not ready' })
    }

    const publishResults = []

    for (const server of servers) {
      try {
        // Find status channel configurations  
        const statusChannels = await prisma.channelConfig.findMany({
          where: {
            serverId: server.id,
            module: 'system',
            eventType: 'status_updates',
            isActive: true
          }
        })

        for (const channelConfig of statusChannels) {
          const result = await publishStatusToChannel(client, channelConfig.channelId, systemStatus, server, requestedBy)
          publishResults.push({
            serverId: server.id,
            serverName: server.name,
            channelId: channelConfig.channelId,
            success: result.success,
            message: result.message
          })
        }

        // If no specific status channels, try to find a general announcements or status channel
        if (statusChannels.length === 0) {
          const guild = await client.guilds.fetch(server.id)
          const statusChannel = guild.channels.cache.find(ch => 
            ch.name.includes('status') || 
            ch.name.includes('announcements') || 
            ch.name.includes('updates')
          )

          if (statusChannel && statusChannel.isTextBased()) {
            const result = await publishStatusToChannel(client, statusChannel.id, systemStatus, server, requestedBy)
            publishResults.push({
              serverId: server.id,
              serverName: server.name,
              channelId: statusChannel.id,
              success: result.success,
              message: result.message
            })
          } else {
            publishResults.push({
              serverId: server.id,
              serverName: server.name,
              channelId: null,
              success: false,
              message: 'No status channel configured or found'
            })
          }
        }
      } catch (error) {
        publishResults.push({
          serverId: server.id,
          serverName: server.name,
          channelId: null,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    res.json({
      success: true,
      published: publishResults.filter(r => r.success).length,
      total: publishResults.length,
      results: publishResults
    })

  } catch (error) {
    console.error('Failed to publish status:', error)
    res.status(500).json({
      error: 'Failed to publish status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

async function publishStatusToChannel(
  client: Client, 
  channelId: string, 
  systemStatus: any, 
  server: any, 
  requestedBy?: string
) {
  try {
    const channel = await client.channels.fetch(channelId)
    if (!channel || !channel.isTextBased()) {
      return { success: false, message: 'Invalid channel' }
    }

    // Calculate overall system health
    const allComponents = [
      systemStatus.webapp,
      systemStatus.discordBot,
      systemStatus.database,
      systemStatus.pwApi,
      ...Object.values(systemStatus.modules)
    ]

    const healthyCount = allComponents.filter(c => c.status === 'healthy').length
    const degradedCount = allComponents.filter(c => c.status === 'degraded').length
    const downCount = allComponents.filter(c => c.status === 'down').length
    const totalComponents = allComponents.length

    const overallStatus = downCount > 0 ? 'degraded' : 
                         degradedCount > 0 ? 'degraded' : 'healthy'

    const statusColor = overallStatus === 'healthy' ? 0x00ff9f : 
                       overallStatus === 'degraded' ? 0xfcee0a : 0xff003c

    const statusEmoji = overallStatus === 'healthy' ? '🟢' : 
                       overallStatus === 'degraded' ? '🟡' : '🔴'

    const embed = {
      title: `${statusEmoji} System Status Report`,
      description: `Automated status update for **${server.alliance?.name || `Alliance ${server.allianceId}`}**`,
      color: statusColor,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '📊 Overall Health',
          value: `**${healthyCount}** Healthy • **${degradedCount}** Degraded • **${downCount}** Down\n` +
                 `**${healthyCount}/${totalComponents}** components operational`,
          inline: false
        },
        {
          name: '🖥️ Core Infrastructure',
          value: `**Webapp:** ${getStatusEmoji(systemStatus.webapp.status)} ${systemStatus.webapp.status.toUpperCase()}\n` +
                 `**Discord Bot:** ${getStatusEmoji(systemStatus.discordBot.status)} ${systemStatus.discordBot.status.toUpperCase()}\n` +
                 `**Database:** ${getStatusEmoji(systemStatus.database.status)} ${systemStatus.database.status.toUpperCase()}\n` +
                 `**P&W API:** ${getStatusEmoji(systemStatus.pwApi.status)} ${systemStatus.pwApi.status.toUpperCase()}`,
          inline: true
        },
        {
          name: '🧩 Module Status',
          value: `**War:** ${getStatusEmoji(systemStatus.modules.war.status)} ${systemStatus.modules.war.status.toUpperCase()}\n` +
                 `**Economic:** ${getStatusEmoji(systemStatus.modules.economic.status)} ${systemStatus.modules.economic.status.toUpperCase()}\n` +
                 `**Membership:** ${getStatusEmoji(systemStatus.modules.membership.status)} ${systemStatus.modules.membership.status.toUpperCase()}\n` +
                 `**Bot Management:** ${getStatusEmoji(systemStatus.modules.botManagement.status)} ${systemStatus.modules.botManagement.status.toUpperCase()}\n` +
                 `**Quests:** ${getStatusEmoji(systemStatus.modules.quests.status)} ${systemStatus.modules.quests.status.toUpperCase()}`,
          inline: true
        }
      ],
      footer: {
        text: `${requestedBy ? `Requested by ${requestedBy} • ` : ''}Next auto-update: ${new Date(systemStatus.nextUpdate).toLocaleTimeString()}`,
        icon_url: 'https://raw.githubusercontent.com/DevCodeRift/politics-war-alliance-manager/main/assets/bot-avatar.png'
      }
    }

    // Add performance details if available
    const performanceDetails = []
    if (systemStatus.webapp.responseTime) {
      performanceDetails.push(`**Webapp:** ${systemStatus.webapp.responseTime}ms`)
    }
    if (systemStatus.database.responseTime) {
      performanceDetails.push(`**Database:** ${systemStatus.database.responseTime}ms`)
    }
    if (systemStatus.pwApi.responseTime) {
      performanceDetails.push(`**P&W API:** ${systemStatus.pwApi.responseTime}ms`)
    }

    if (performanceDetails.length > 0) {
      embed.fields.push({
        name: '⚡ Response Times',
        value: performanceDetails.join('\n'),
        inline: false
      })
    }

    // Add any critical alerts
    const criticalIssues = allComponents.filter(c => c.status === 'down')
    if (criticalIssues.length > 0) {
      embed.fields.push({
        name: '🚨 Critical Issues',
        value: criticalIssues.map(issue => `**${issue.name}:** ${issue.details || 'Service unavailable'}`).join('\n'),
        inline: false
      })
    }

    await channel.send({ embeds: [embed] })

    return { success: true, message: 'Status published successfully' }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '🟢'
    case 'degraded': return '🟡'
    case 'down': return '🔴'
    default: return '⚪'
  }
}

export default router