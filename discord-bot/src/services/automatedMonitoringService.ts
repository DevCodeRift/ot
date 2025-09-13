import { PrismaClient } from '@prisma/client'
import * as winston from 'winston'

export class AutomatedMonitoringService {
  private prisma: PrismaClient
  private logger: winston.Logger
  private monitoringInterval: NodeJS.Timeout | null = null
  private readonly INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

  constructor(prisma: PrismaClient, logger: winston.Logger) {
    this.prisma = prisma
    this.logger = logger
  }

  start() {
    this.logger.info('[MONITORING] Starting automated status monitoring (30-minute intervals)')
    
    // Run initial check after 1 minute
    setTimeout(() => this.performStatusCheck(), 60000)
    
    // Set up recurring checks every 30 minutes
    this.monitoringInterval = setInterval(() => {
      this.performStatusCheck()
    }, this.INTERVAL_MS)
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      this.logger.info('[MONITORING] Stopped automated status monitoring')
    }
  }

  private async performStatusCheck() {
    try {
      this.logger.info('[MONITORING] Performing automated status check...')

      // Get all active alliances with Discord servers
      const alliances = await this.prisma.discordServer.findMany({
        where: { isActive: true },
        include: { alliance: true },
        distinct: ['allianceId']
      })

      for (const server of alliances) {
        if (!server.allianceId) continue

        try {
          await this.checkAndPublishStatus(server.allianceId)
        } catch (error) {
          this.logger.error(`[MONITORING] Failed to check status for alliance ${server.allianceId}:`, error)
        }
      }

      this.logger.info(`[MONITORING] Completed status check for ${alliances.length} alliances`)
    } catch (error) {
      this.logger.error('[MONITORING] Failed to perform automated status check:', error)
    }
  }

  private async checkAndPublishStatus(allianceId: number) {
    try {
      // Fetch system status
      const systemStatus = await this.fetchSystemStatus(allianceId)
      
      // Check if there are any critical issues
      const criticalIssues = this.identifyCriticalIssues(systemStatus)
      
      // Publish status if:
      // 1. There are critical issues (immediate alert)
      // 2. It's a scheduled 30-minute update
      const shouldPublish = criticalIssues.length > 0 || this.isScheduledUpdate()

      if (shouldPublish) {
        await this.publishStatusUpdate(allianceId, systemStatus, criticalIssues)
      }

      // Log the status check
      this.logger.info(`[MONITORING] Alliance ${allianceId} status: ${this.getOverallStatus(systemStatus)}`, {
        allianceId,
        criticalIssues: criticalIssues.length,
        published: shouldPublish
      })

    } catch (error) {
      this.logger.error(`[MONITORING] Error checking status for alliance ${allianceId}:`, error)
    }
  }

  private async fetchSystemStatus(allianceId: number) {
    // This would call the same logic as the API endpoint
    const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3000'
    
    try {
      const response = await fetch(`${webappUrl}/api/system/status?allianceId=${allianceId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WEBAPP_API_SECRET}`
        }
      })

      if (!response.ok) {
        throw new Error(`Status API returned ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      this.logger.error('[MONITORING] Failed to fetch system status:', error)
      // Return a minimal status object indicating the webapp is down
      return {
        webapp: { status: 'down', lastChecked: new Date().toISOString() },
        discordBot: { status: 'unknown', lastChecked: new Date().toISOString() },
        database: { status: 'unknown', lastChecked: new Date().toISOString() },
        pwApi: { status: 'unknown', lastChecked: new Date().toISOString() },
        modules: {
          war: { status: 'unknown', lastChecked: new Date().toISOString() },
          economic: { status: 'unknown', lastChecked: new Date().toISOString() },
          membership: { status: 'unknown', lastChecked: new Date().toISOString() },
          botManagement: { status: 'unknown', lastChecked: new Date().toISOString() },
          quests: { status: 'unknown', lastChecked: new Date().toISOString() }
        },
        lastUpdate: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + this.INTERVAL_MS).toISOString()
      }
    }
  }

  private identifyCriticalIssues(systemStatus: any): string[] {
    const criticalIssues = []

    // Check core infrastructure
    if (systemStatus.webapp?.status === 'down') {
      criticalIssues.push('Web Application is offline')
    }
    if (systemStatus.discordBot?.status === 'down') {
      criticalIssues.push('Discord Bot is offline')
    }
    if (systemStatus.database?.status === 'down') {
      criticalIssues.push('Database connection failed')
    }
    if (systemStatus.pwApi?.status === 'down') {
      criticalIssues.push('Politics & War API is unreachable')
    }

    // Check critical modules
    if (systemStatus.modules?.war?.status === 'down') {
      criticalIssues.push('War Management module is offline')
    }

    return criticalIssues
  }

  private getOverallStatus(systemStatus: any): string {
    const allComponents = [
      systemStatus.webapp,
      systemStatus.discordBot,
      systemStatus.database,
      systemStatus.pwApi,
      ...Object.values(systemStatus.modules || {})
    ]

    const downCount = allComponents.filter((c: any) => c?.status === 'down').length
    const degradedCount = allComponents.filter((c: any) => c?.status === 'degraded').length

    if (downCount > 0) return 'critical'
    if (degradedCount > 0) return 'degraded'
    return 'healthy'
  }

  private isScheduledUpdate(): boolean {
    // Check if this is a scheduled 30-minute update
    // For simplicity, we'll publish every time for now
    // In production, you might want to store last publish time and check intervals
    return true
  }

  private async publishStatusUpdate(allianceId: number, systemStatus: any, criticalIssues: string[]) {
    try {
      // Find Discord servers for this alliance
      const servers = await this.prisma.discordServer.findMany({
        where: {
          allianceId,
          isActive: true
        },
        include: {
          alliance: true
        }
      })

      if (servers.length === 0) {
        this.logger.warn(`[MONITORING] No Discord servers found for alliance ${allianceId}`)
        return
      }

      // Import the Discord client
      const { getDiscordClient } = await import('../index')
      const client = getDiscordClient()

      if (!client?.isReady()) {
        this.logger.error('[MONITORING] Discord client not ready for status publishing')
        return
      }

      let publishCount = 0

      for (const server of servers) {
        try {
          const guild = await client.guilds.fetch(server.id)
          
          // Get configured status channel from database
          const channelConfig = await this.prisma.$queryRaw<Array<{channel_id: string, is_active: boolean}>>`
            SELECT channel_id, is_active 
            FROM channel_configs 
            WHERE server_id = ${server.id}
              AND module = 'system-monitoring'
              AND event_type = 'status-updates'
              AND is_active = true
            LIMIT 1
          `

          let statusChannel = null

          if (channelConfig.length > 0) {
            // Use configured channel
            try {
              statusChannel = await guild.channels.fetch(channelConfig[0].channel_id)
            } catch (error) {
              this.logger.warn(`[MONITORING] Configured channel ${channelConfig[0].channel_id} not found in ${server.name}, falling back to auto-detection`)
            }
          }

          // Fallback to auto-detection if no configured channel or channel not found
          if (!statusChannel) {
            statusChannel = guild.channels.cache.find((ch: any) => 
              (ch.name.includes('status') || 
               ch.name.includes('system-status') ||
               ch.name.includes('monitoring') ||
               ch.name.includes('announcements') || 
               ch.name.includes('updates') ||
               ch.name.includes('general')) &&
              ch.isTextBased()
            )
          }

          if (statusChannel && statusChannel.isTextBased()) {
            await this.sendStatusEmbed(statusChannel, systemStatus, server, criticalIssues)
            publishCount++
            this.logger.info(`[MONITORING] Published status to ${server.name}#${statusChannel.name}`)
          } else {
            this.logger.warn(`[MONITORING] No suitable status channel found in ${server.name}. Use /setup-status-channel to configure one.`)
          }
        } catch (error) {
          this.logger.error(`[MONITORING] Failed to publish to server ${server.name}:`, error)
        }
      }

      this.logger.info(`[MONITORING] Published status updates to ${publishCount}/${servers.length} servers for alliance ${allianceId}`)

    } catch (error) {
      this.logger.error('[MONITORING] Failed to publish status updates:', error)
    }
  }

  private async sendStatusEmbed(channel: any, systemStatus: any, server: any, criticalIssues: string[]) {
    const allComponents = [
      systemStatus.webapp,
      systemStatus.discordBot,
      systemStatus.database,
      systemStatus.pwApi,
      ...Object.values(systemStatus.modules || {})
    ]

    const healthyCount = allComponents.filter((c: any) => c?.status === 'healthy').length
    const degradedCount = allComponents.filter((c: any) => c?.status === 'degraded').length
    const downCount = allComponents.filter((c: any) => c?.status === 'down').length

    const overallStatus = downCount > 0 ? 'critical' : 
                         degradedCount > 0 ? 'degraded' : 'healthy'

    const statusColor = overallStatus === 'healthy' ? 0x00ff9f : 
                       overallStatus === 'degraded' ? 0xfcee0a : 0xff003c

    const statusEmoji = overallStatus === 'healthy' ? '🟢' : 
                       overallStatus === 'degraded' ? '🟡' : '🔴'

    const embed = {
      title: `${statusEmoji} Automated System Status Update`,
      description: `**${server.alliance?.name || `Alliance ${server.allianceId}`}** - 30-minute health check`,
      color: statusColor,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '📊 System Overview',
          value: `**${healthyCount}** Healthy • **${degradedCount}** Degraded • **${downCount}** Down\n` +
                 `**Overall Status:** ${overallStatus.toUpperCase()}`,
          inline: false
        },
        {
          name: '🖥️ Core Systems',
          value: `**Webapp:** ${this.getStatusEmoji(systemStatus.webapp?.status)} ${systemStatus.webapp?.status?.toUpperCase() || 'UNKNOWN'}\n` +
                 `**Discord Bot:** ${this.getStatusEmoji(systemStatus.discordBot?.status)} ${systemStatus.discordBot?.status?.toUpperCase() || 'UNKNOWN'}\n` +
                 `**Database:** ${this.getStatusEmoji(systemStatus.database?.status)} ${systemStatus.database?.status?.toUpperCase() || 'UNKNOWN'}\n` +
                 `**P&W API:** ${this.getStatusEmoji(systemStatus.pwApi?.status)} ${systemStatus.pwApi?.status?.toUpperCase() || 'UNKNOWN'}`,
          inline: true
        },
        {
          name: '🧩 Modules',
          value: `**War:** ${this.getStatusEmoji(systemStatus.modules?.war?.status)} ${systemStatus.modules?.war?.status?.toUpperCase() || 'UNKNOWN'}\n` +
                 `**Economic:** ${this.getStatusEmoji(systemStatus.modules?.economic?.status)} ${systemStatus.modules?.economic?.status?.toUpperCase() || 'UNKNOWN'}\n` +
                 `**Membership:** ${this.getStatusEmoji(systemStatus.modules?.membership?.status)} ${systemStatus.modules?.membership?.status?.toUpperCase() || 'UNKNOWN'}\n` +
                 `**Bot Mgmt:** ${this.getStatusEmoji(systemStatus.modules?.botManagement?.status)} ${systemStatus.modules?.botManagement?.status?.toUpperCase() || 'UNKNOWN'}\n` +
                 `**Quests:** ${this.getStatusEmoji(systemStatus.modules?.quests?.status)} ${systemStatus.modules?.quests?.status?.toUpperCase() || 'UNKNOWN'}`,
          inline: true
        }
      ],
      footer: {
        text: `Automated monitoring • Next check: ${new Date(Date.now() + this.INTERVAL_MS).toLocaleTimeString()}`,
        icon_url: 'https://cdn.discordapp.com/attachments/123456789/123456789/bot-avatar.png'
      }
    }

    // Add critical issues if any
    if (criticalIssues.length > 0) {
      embed.fields.unshift({
        name: '🚨 Critical Alerts',
        value: criticalIssues.map(issue => `• ${issue}`).join('\n'),
        inline: false
      })
    }

    // Add performance metrics if available
    const performanceDetails = []
    if (systemStatus.webapp?.responseTime) {
      performanceDetails.push(`**Webapp:** ${systemStatus.webapp.responseTime}ms`)
    }
    if (systemStatus.database?.responseTime) {
      performanceDetails.push(`**Database:** ${systemStatus.database.responseTime}ms`)
    }
    if (systemStatus.pwApi?.responseTime) {
      performanceDetails.push(`**P&W API:** ${systemStatus.pwApi.responseTime}ms`)
    }

    if (performanceDetails.length > 0) {
      embed.fields.push({
        name: '⚡ Performance',
        value: performanceDetails.join(' • '),
        inline: false
      })
    }

    await channel.send({ embeds: [embed] })
  }

  private getStatusEmoji(status?: string): string {
    switch (status) {
      case 'healthy': return '🟢'
      case 'degraded': return '🟡'  
      case 'down': return '🔴'
      default: return '⚪'
    }
  }
}