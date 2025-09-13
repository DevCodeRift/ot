import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '@/types/discord';

const testCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('test-webapp')
    .setDescription('Test connection between Discord bot and webapp'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // This would normally make a request to the webapp
      // For now, we'll simulate a successful response
      const embed = new EmbedBuilder()
        .setTitle('🔗 Webapp Connection Test')
        .setDescription('Successfully connected to Politics & War Alliance Management Platform!')
        .setColor(0x00ff9f) // Cyberpunk green for success
        .addFields(
          { name: '📊 Server ID', value: interaction.guildId || 'Unknown', inline: true },
          { name: '🌐 Status', value: 'Connected', inline: true },
          { name: '🔄 Last Sync', value: new Date().toLocaleString(), inline: true }
        )
        .setTimestamp()
        .setFooter({ 
          text: 'Bot-Webapp Communication Test',
          iconURL: interaction.client.user?.displayAvatarURL()
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Connection Failed')
        .setDescription('Failed to connect to the webapp')
        .setColor(0xff003c) // Cyberpunk red for error
        .addFields(
          { name: '💥 Error', value: 'Connection timeout or webapp offline', inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};

export default testCommand;