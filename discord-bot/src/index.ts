import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import express = require('express');
import * as dotenv from 'dotenv';
import * as winston from 'winston';
import { SlashCommand } from './types/discord';
import { loadCommands } from './utils/commandLoader';
import { loadEvents } from './utils/eventLoader';
import { PWKitSubscriptionService } from './services/pnwkitSubscriptionService';
import { AutomatedMonitoringService } from './services/automatedMonitoringService';

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

// Initialize automated monitoring service
let monitoringService: AutomatedMonitoringService;

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
  try {
    const uptime = process.uptime()
    const memUsage = process.memoryUsage()
    
    res.json({
      status: 'ok',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      uptimeSeconds: Math.floor(uptime),
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
      },
      discord: {
        status: client.isReady() ? 'connected' : 'disconnected',
        guilds: client.guilds.cache.size,
        ping: client.ws.ping
      },
      details: 'All systems operational',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

// Status publisher endpoint
app.post('/api/publish-status', async (req: express.Request, res: express.Response) => {
  try {
    const { allianceId, systemStatus, requestedBy } = req.body

    if (!allianceId || !systemStatus) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get Discord servers for this alliance
    const servers = await prisma.discordServer.findMany({
      where: {
        allianceId: parseInt(allianceId),
        isActive: true
      },
      include: {
        alliance: true
      }
    })

    if (servers.length === 0) {
      return res.status(404).json({ error: 'No Discord servers found for this alliance' })
    }

    if (!client.isReady()) {
      return res.status(503).json({ error: 'Discord bot is not ready' })
    }

    const publishResults = []

    for (const server of servers) {
      try {
        // Find a suitable channel for status updates
        const guild = await client.guilds.fetch(server.id)
        
        // Look for status, announcements, or general channels
        const statusChannel = guild.channels.cache.find((ch: any) => 
          (ch.name.includes('status') || 
           ch.name.includes('announcements') || 
           ch.name.includes('updates') ||
           ch.name.includes('general')) &&
          ch.isTextBased()
        )

        if (statusChannel) {
          const result = await publishStatusToChannel(statusChannel, systemStatus, server, requestedBy)
          publishResults.push({
            serverId: server.id,
            serverName: server.name,
            channelId: statusChannel.id,
            channelName: statusChannel.name,
            success: result.success,
            message: result.message
          })
        } else {
          publishResults.push({
            serverId: server.id,
            serverName: server.name,
            channelId: null,
            success: false,
            message: 'No suitable status channel found'
          })
        }
      } catch (error) {
        publishResults.push({
          serverId: server.id,
          serverName: server.name,
          channelId: null,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    res.json({
      success: true,
      published: publishResults.filter(r => r.success).length,
      total: publishResults.length,
      results: publishResults
    })

  } catch (error) {
    logger.error('Failed to publish status:', error)
    res.status(500).json({
      error: 'Failed to publish status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

async function publishStatusToChannel(channel: any, systemStatus: any, server: any, requestedBy?: string) {
  try {
    // Calculate overall system health
    const allComponents = [
      systemStatus.webapp,
      systemStatus.discordBot,
      systemStatus.database,
      systemStatus.pwApi,
      ...Object.values(systemStatus.modules)
    ]

    const healthyCount = allComponents.filter((c: any) => c.status === 'healthy').length
    const degradedCount = allComponents.filter((c: any) => c.status === 'degraded').length
    const downCount = allComponents.filter((c: any) => c.status === 'down').length

    const overallStatus = downCount > 0 ? 'degraded' : 
                         degradedCount > 0 ? 'degraded' : 'healthy'

    const statusColor = overallStatus === 'healthy' ? 0x00ff9f : 
                       overallStatus === 'degraded' ? 0xfcee0a : 0xff003c

    const statusEmoji = overallStatus === 'healthy' ? '🟢' : 
                       overallStatus === 'degraded' ? '🟡' : '🔴'

    const embed = {
      title: `${statusEmoji} System Status Report`,
      description: `Automated status update for **${server.alliance?.name || `Alliance ${server.allianceId}`}**`,
      color: statusColor,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '📊 Overall Health',
          value: `**${healthyCount}** Healthy • **${degradedCount}** Degraded • **${downCount}** Down\n` +
                 `**${healthyCount}/${allComponents.length}** components operational`,
          inline: false
        },
        {
          name: '🖥️ Core Infrastructure',
          value: `**Webapp:** ${getStatusEmoji(systemStatus.webapp.status)} ${systemStatus.webapp.status.toUpperCase()}\n` +
                 `**Discord Bot:** ${getStatusEmoji(systemStatus.discordBot.status)} ${systemStatus.discordBot.status.toUpperCase()}\n` +
                 `**Database:** ${getStatusEmoji(systemStatus.database.status)} ${systemStatus.database.status.toUpperCase()}\n` +
                 `**P&W API:** ${getStatusEmoji(systemStatus.pwApi.status)} ${systemStatus.pwApi.status.toUpperCase()}`,
          inline: true
        },
        {
          name: '🧩 Module Status',
          value: `**War:** ${getStatusEmoji(systemStatus.modules.war.status)} ${systemStatus.modules.war.status.toUpperCase()}\n` +
                 `**Economic:** ${getStatusEmoji(systemStatus.modules.economic.status)} ${systemStatus.modules.economic.status.toUpperCase()}\n` +
                 `**Membership:** ${getStatusEmoji(systemStatus.modules.membership.status)} ${systemStatus.modules.membership.status.toUpperCase()}\n` +
                 `**Bot Management:** ${getStatusEmoji(systemStatus.modules.botManagement.status)} ${systemStatus.modules.botManagement.status.toUpperCase()}\n` +
                 `**Quests:** ${getStatusEmoji(systemStatus.modules.quests.status)} ${systemStatus.modules.quests.status.toUpperCase()}`,
          inline: true
        }
      ],
      footer: {
        text: `${requestedBy ? `Requested by ${requestedBy} • ` : ''}Next auto-update: ${new Date(systemStatus.nextUpdate).toLocaleTimeString()}`,
        icon_url: 'https://cdn.discordapp.com/attachments/123456789/123456789/bot-avatar.png'
      }
    }

    // Type guard to ensure channel can send messages
    if (!channel.isTextBased() || !('send' in channel)) {
      throw new Error('Channel does not support sending messages')
    }

    await channel.send({ embeds: [embed] })
    return { success: true, message: 'Status published successfully' }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '🟢'
    case 'degraded': return '🟡'  
    case 'down': return '🔴'
    default: return '⚪'
  }
}

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
    // Shutdown automated monitoring service
    if (monitoringService) {
      await monitoringService.stop();
      logger.info('📊 Automated monitoring service stopped');
    }
    
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
      
      // Initialize Automated Monitoring Service
      try {
        monitoringService = new AutomatedMonitoringService(prisma, logger);
        await monitoringService.start();
        logger.info('📊 Automated monitoring service started');
      } catch (error) {
        logger.error('Failed to start automated monitoring service:', error);
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