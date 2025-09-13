import { ChatInputCommandInteraction, SlashCommandBuilder, Client, Collection } from 'discord.js';

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotClient extends Client {
  commands: Collection<string, SlashCommand>;
}

export interface ServerConfig {
  serverId: string;
  allianceId?: number;
  enabledModules: string[];
  commandPermissions: Record<string, string[]>;
  customSettings: Record<string, any>;
}

export interface WebappApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}