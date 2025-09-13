import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import express = require('express');
import * as dotenv from 'dotenv';
import * as winston from 'winston';
import { SlashCommand } from './types/discord';
import { loadCommands } from './utils/commandLoader';
import { loadEvents } from './utils/eventLoader';
import { PWKitSubscriptionService } from './services/pnwkitSubscriptionService';

// Load environment variables
dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'discord-bot' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Prisma client (shared database with webapp)
const prisma = new PrismaClient();

// Initialize P&W subscription service (using pnwkit-2.0)
let pwSubscriptionService: PWKitSubscriptionService;

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
}) as any;

// Add commands collection to client
client.commands = new Collection<string, SlashCommand>();

// Initialize Express server for webapp communication
const app = express();
app.use(express.json());

// Import route handlers
import rolesRouter from './routes/roles';
import testRouter from './routes/test';
import channelsRouter from './routes/channels';

// Use route handlers
app.use('/api', rolesRouter);
app.use('/api', testRouter);
app.use('/api', channelsRouter);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'ok', 
    bot: client.isReady() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API endpoint for webapp communication
app.post('/api/test-connection', (req: express.Request, res: express.Response) => {
  // Optional: Verify authorization header
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.WEBAPP_API_SECRET;
  
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    logger.warn('Unauthorized webapp connection attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { serverId, message } = req.body;
  
  logger.info('Received test connection request', { serverId, message });
  
  // Get detailed server information
  const servers = client.guilds.cache.map((guild: any) => ({
    id: guild.id,
    name: guild.name,
    memberCount: guild.memberCount,
    icon: guild.iconURL(),
    joinedAt: guild.joinedAt?.toISOString()
  }));
  
  return res.json({
    success: true,
    message: 'Discord bot received your message!',
    botStatus: client.isReady() ? 'online' : 'offline',
    serverCount: client.guilds.cache.size,
    servers: servers,
    timestamp: new Date().toISOString()
  });
});

// Bot ready event
client.once(Events.ClientReady, async (readyClient: Client<true>) => {
  logger.info(`🤖 Discord bot logged in as ${readyClient.user.tag}!`);
  logger.info(`🔗 Connected to ${readyClient.guilds.cache.size} Discord servers`);
  
  // Load commands
  await loadCommands(client, logger);
  
  // Load events
  await loadEvents(client, logger);
  
  logger.info('✅ Discord bot is ready and operational!');
});

// Global error handling
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
async function shutdown() {
  logger.info('🔄 Shutting down Discord bot...');
  
  try {
    // Shutdown P&W subscription service
    if (pwSubscriptionService) {
      await pwSubscriptionService.shutdown();
      logger.info('📡 P&W subscription service shutdown');
    }
    
    await prisma.$disconnect();
    logger.info('📦 Database connection closed');
    
    client.destroy();
    logger.info('🤖 Discord client destroyed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the bot and server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('📦 Database connected successfully');
    
    // Start Express server
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      logger.info(`🌐 Express server running on port ${port}`);
    });
    
    // Login to Discord
    await client.login(process.env.DISCORD_BOT_TOKEN);
    
    // Initialize P&W subscription service after Discord is ready
    client.once(Events.ClientReady, async () => {
      logger.info('🤖 Discord bot is ready!');
      
      // Initialize P&W subscription service
      try {
        pwSubscriptionService = new PWKitSubscriptionService(prisma, logger);
        await pwSubscriptionService.initialize();
        logger.info('📡 P&W subscription service initialized');
      } catch (error) {
        logger.error('Failed to initialize P&W subscription service:', error);
      }
    });
    
  } catch (error) {
    logger.error('Failed to start Discord bot:', error);
    process.exit(1);
  }
}

// Export instances for use in other modules
export { client, prisma, logger };

// Export function to get client instance
export const getDiscordClient = () => client;

// Start the application
if (require.main === module) {
  start();
}