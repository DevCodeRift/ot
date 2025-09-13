import { Client, Collection } from 'discord.js';
import { SlashCommand } from '../types/discord';
import { Logger } from 'winston';
import * as fs from 'fs';
import * as path from 'path';

export async function loadCommands(client: Client, logger: Logger): Promise<void> {
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  // Create commands directory if it doesn't exist
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    logger.info('Created commands directory');
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    file.endsWith('.js') // Look for .js files in compiled output
  );

  if (commandFiles.length === 0) {
    logger.info('No command files found');
    return;
  }

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      // Use require for CommonJS compiled output
      delete require.cache[require.resolve(filePath)]; // Clear cache
      const commandModule = require(filePath);
      
      // Handle both default exports and named exports (data, execute)
      let command: SlashCommand;
      
      if (commandModule.default) {
        // Default export pattern
        command = commandModule.default;
      } else if (commandModule.data && commandModule.execute) {
        // Named exports pattern
        command = {
          data: commandModule.data,
          execute: commandModule.execute
        };
      } else {
        logger.warn(`Command file ${file} is missing required exports (data and execute)`);
        continue;
      }
      
      if (command.data && typeof command.execute === 'function') {
        (client as any).commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(`Command file ${file} has invalid structure`);
      }
    } catch (error) {
      logger.error(`Error loading command ${file}:`, error);
    }
  }
}