/**
 * Standalone script to register Discord slash commands
 * Usage: npm run register-commands
 */

import * as dotenv from 'dotenv';
import * as winston from 'winston';
import { registerCommands } from './utils/commandRegistry';

// Load environment variables
dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

async function main() {
  logger.info('🔧 Starting Discord command registration...');
  
  try {
    await registerCommands(logger);
    logger.info('✅ Command registration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Command registration failed:', error);
    process.exit(1);
  }
}

main();