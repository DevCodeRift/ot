import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const data = new SlashCommandBuilder()
  .setName('setup-status-channel')
  .setDescription('Configure which channel receives automated status updates')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Channel to receive status updates')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('enable')
      .setDescription('Enable or disable status updates')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    return interaction.reply({ 
      content: '❌ This command can only be used in a server.', 
      ephemeral: true 
    })
  }

  try {
    const channel = interaction.options.getChannel('channel')
    const enable = interaction.options.getBoolean('enable') ?? true

    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: '❌ Please select a valid text channel.',
        ephemeral: true
      })
    }

    // Check if user has manage channels permission
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: '❌ You need "Manage Channels" permission to configure status updates.',
        ephemeral: true
      })
    }

    // Ensure Discord server record exists
    await prisma.discordServer.upsert({
      where: { id: interaction.guildId },
      update: { 
        name: interaction.guild?.name,
        updatedAt: new Date()
      },
      create: {
        id: interaction.guildId,
        name: interaction.guild?.name || 'Unknown Server',
        ownerId: interaction.guild?.ownerId,
        isActive: true,
        enabledModules: []
      }
    })

    // Configure status channel using raw queries for better compatibility
    if (enable) {
      // Use raw query to handle the upsert operation
      await prisma.$executeRaw`
        INSERT INTO channel_configs (id, "serverId", module, "eventType", "channelId", "isActive", settings, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${interaction.guildId},
          'system-monitoring',
          'status-updates',
          ${channel.id},
          true,
          ${JSON.stringify({
            channelName: channel.name,
            configuredBy: interaction.user.id,
            configuredAt: new Date().toISOString()
          })}::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT ("serverId", module, "eventType")
        DO UPDATE SET
          "channelId" = EXCLUDED."channelId",
          "isActive" = EXCLUDED."isActive",
          settings = EXCLUDED.settings,
          "updatedAt" = NOW()
      `

      return interaction.reply({
        content: `✅ **Status Channel Configured**\n\n` +
                `📊 Status updates will now be sent to ${channel}\n` +
                `⏰ Updates are published automatically every 30 minutes\n` +
                `🔧 Use \`/status\` to see current system status`,
        ephemeral: true
      })
    } else {
      // Disable status updates
      await prisma.$executeRaw`
        UPDATE channel_configs 
        SET "isActive" = false, "updatedAt" = NOW()
        WHERE "serverId" = ${interaction.guildId}
          AND module = 'system-monitoring'
          AND "eventType" = 'status-updates'
      `

      return interaction.reply({
        content: `❌ **Status Updates Disabled**\n\nAutomated status updates have been disabled for this server.`,
        ephemeral: true
      })
    }

  } catch (error) {
    console.error('Error configuring status channel:', error)
    return interaction.reply({
      content: '❌ An error occurred while configuring the status channel. Please try again.',
      ephemeral: true
    })
  }
}