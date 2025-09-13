import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Show current system status')

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply()

    // Get system status from webapp API
    const webappUrl = process.env.WEBAPP_API_URL || 'http://localhost:3000'
    let systemStatus
    
    try {
      const response = await fetch(`${webappUrl}/api/system/status`, {
        headers: {
          'Authorization': `Bearer ${process.env.WEBAPP_API_SECRET}`
        }
      })

      if (!response.ok) {
        throw new Error(`Status API returned ${response.status}`)
      }

      systemStatus = await response.json()
    } catch (error) {
      console.error('Failed to fetch system status:', error)
      return interaction.editReply({
        content: '❌ Unable to fetch system status. Please try again later.'
      })
    }

    // Create status embed
    const getStatusEmoji = (status: string): string => {
      switch (status) {
        case 'healthy': return '🟢'
        case 'degraded': return '🟡'  
        case 'down': return '🔴'
        default: return '⚪'
      }
    }

    const getStatusColor = (status: string): number => {
      switch (status) {
        case 'healthy': return 0x00ff9f
        case 'degraded': return 0xfcee0a
        case 'down': return 0xff003c
        default: return 0x666666
      }
    }

    // Calculate overall status
    const allComponents = [
      systemStatus.webapp,
      systemStatus.discordBot,
      systemStatus.database,
      systemStatus.pwApi,
      ...Object.values(systemStatus.modules)
    ]

    const healthyCount = allComponents.filter((c: any) => c.status === 'healthy').length
    const degradedCount = allComponents.filter((c: any) => c.status === 'degraded').length
    const downCount = allComponents.filter((c: any) => c.status === 'down').length

    const overallStatus = downCount > 0 ? 'down' : 
                         degradedCount > 0 ? 'degraded' : 'healthy'

    const embed = new EmbedBuilder()
      .setTitle(`${getStatusEmoji(overallStatus)} System Status`)
      .setDescription(`Current status of all system components`)
      .setColor(getStatusColor(overallStatus))
      .setTimestamp(new Date())
      .addFields([
        {
          name: '📊 Overall Health',
          value: `**${healthyCount}** Healthy • **${degradedCount}** Degraded • **${downCount}** Down\n` +
                 `**${healthyCount}/${allComponents.length}** components operational`,
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
      ])
      .setFooter({
        text: `Use /setup-status-channel to configure automated updates • Next update: ${new Date(systemStatus.nextUpdate).toLocaleTimeString()}`,
        iconURL: interaction.client.user?.displayAvatarURL()
      })

    await interaction.editReply({ embeds: [embed] })

  } catch (error) {
    console.error('Error in status command:', error)
    await interaction.editReply({
      content: '❌ An error occurred while fetching system status.'
    })
  }
}