import { REST, Routes } from 'discord.js';
import { Logger } from 'winston';
import * as fs from 'fs';
import * as path from 'path';

export async function registerCommands(logger: Logger): Promise<void> {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    logger.warn('Commands directory does not exist');
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    file.endsWith('.js') // Look for .js files in compiled output
  );

  // Collect command data for registration
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      // Use require for CommonJS compiled output
      delete require.cache[require.resolve(filePath)]; // Clear cache
      const commandModule = require(filePath);
      
      let commandData;
      
      if (commandModule.default && commandModule.default.data) {
        commandData = commandModule.default.data;
      } else if (commandModule.data) {
        commandData = commandModule.data;
      } else {
        logger.warn(`Command file ${file} is missing data export`);
        continue;
      }
      
      commands.push(commandData.toJSON());
      logger.info(`Prepared command for registration: ${commandData.name}`);
    } catch (error) {
      logger.error(`Error preparing command ${file} for registration:`, error);
    }
  }

  if (commands.length === 0) {
    logger.info('No commands to register');
    return;
  }

  // Register commands with Discord
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!clientId) {
    logger.error('DISCORD_CLIENT_ID environment variable is required for command registration');
    return;
  }

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    ) as any[];

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    logger.error('Error registering commands with Discord:', error);
  }
}