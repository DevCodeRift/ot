import { Client, Collection } from 'discord.js';
import { SlashCommand } from '@/types/discord';
import { Logger } from 'winston';
import fs from 'fs';
import path from 'path';

export async function loadCommands(client: Client, logger: Logger): Promise<void> {
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  // Create commands directory if it doesn't exist
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    logger.info('Created commands directory');
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  if (commandFiles.length === 0) {
    logger.info('No command files found');
    return;
  }

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = await import(filePath) as { default: SlashCommand };
      
      if (command.default && command.default.data && typeof command.default.execute === 'function') {
        (client as any).commands.set(command.default.data.name, command.default);
        logger.info(`Loaded command: ${command.default.data.name}`);
      } else {
        logger.warn(`Command file ${file} is missing required properties`);
      }
    } catch (error) {
      logger.error(`Error loading command ${file}:`, error);
    }
  }
}