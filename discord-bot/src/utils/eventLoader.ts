import { Client } from 'discord.js';
import { Logger } from 'winston';
import fs from 'fs';
import path from 'path';

export async function loadEvents(client: Client, logger: Logger): Promise<void> {
  const eventsPath = path.join(__dirname, '..', 'events');
  
  // Create events directory if it doesn't exist
  if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
    logger.info('Created events directory');
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  if (eventFiles.length === 0) {
    logger.info('No event files found');
    return;
  }

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = await import(filePath);
      
      if (event.default) {
        if (event.default.once) {
          client.once(event.default.name, (...args: any[]) => event.default.execute(...args));
        } else {
          client.on(event.default.name, (...args: any[]) => event.default.execute(...args));
        }
        logger.info(`Loaded event: ${event.default.name}`);
      }
    } catch (error) {
      logger.error(`Error loading event ${file}:`, error);
    }
  }
}