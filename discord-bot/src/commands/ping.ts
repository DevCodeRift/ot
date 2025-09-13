import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../types/discord';

const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test if the bot is responsive'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Pong!')
      .setDescription('Politics & War Alliance Bot is online!')
      .setColor(0x00f5ff) // Cyberpunk cyan
      .addFields(
        { name: '🏓 Latency', value: `${Date.now() - interaction.createdTimestamp}ms`, inline: true },
        { name: '📡 API Latency', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
      )
      .setTimestamp()
      .setFooter({ 
        text: 'Politics & War Alliance Management Platform',
        iconURL: interaction.client.user?.displayAvatarURL()
      });

    await interaction.reply({ embeds: [embed] });
  }
};

export default pingCommand;