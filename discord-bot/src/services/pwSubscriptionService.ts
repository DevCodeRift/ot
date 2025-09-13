import axios from 'axios';
import Pusher from 'pusher-js';
import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';

interface PWWar {
  id: string;
  date: string;
  reason: string;
  war_type: string;
  att_id: string;
  def_id: string;
  att_alliance_id: string;
  def_alliance_id: string;
  attacker: {
    id: string;
    nation_name: string;
    leader_name: string;
    alliance?: {
      id: string;
      name: string;
      acronym: string;
    };
  };
  defender: {
    id: string;
    nation_name: string;
    leader_name: string;
    alliance?: {
      id: string;
      name: string;
      acronym: string;
    };
  };
}

export class PWSubscriptionService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private apiKey: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  constructor(prisma: PrismaClient, logger: winston.Logger) {
    this.prisma = prisma;
    this.logger = logger;
    this.apiKey = process.env.POLITICS_AND_WAR_API_KEY!;
    
    if (!this.apiKey) {
      throw new Error('POLITICS_AND_WAR_API_KEY environment variable is required');
    }
  }

  async initialize() {
    try {
      this.logger.info('[PW_SUBSCRIPTION] Initializing Politics & War subscription service...');
      
      // Get all active alliance IDs from our database
      const activeAlliances = await this.prisma.discordServer.findMany({
        where: {
          isActive: true,
          allianceId: {
            not: null
          }
        },
        select: {
          allianceId: true
        },
        distinct: ['allianceId']
      });

      const allianceIds = activeAlliances
        .map(server => server.allianceId)
        .filter(id => id !== null) as number[];

      if (allianceIds.length === 0) {
        this.logger.warn('[PW_SUBSCRIPTION] No active alliances found, skipping subscription setup');
        return;
      }

      // Subscribe to war events for our alliances
      await this.subscribeToWarEvents(allianceIds);
      
    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Failed to initialize subscription service:', error);
      this.scheduleReconnect();
    }
  }

  private async subscribeToWarEvents(allianceIds: number[]) {
    try {
      // Subscribe to war create events filtered by alliance IDs
      const allianceIdString = allianceIds.join(',');
      const subscribeUrl = `https://api.politicsandwar.com/subscriptions/v1/subscribe/war/create?api_key=${this.apiKey}&att_alliance_id=${allianceIdString}&def_alliance_id=${allianceIdString}`;
      
      this.logger.info(`[PW_SUBSCRIPTION] Subscribing to war events for alliances: ${allianceIdString}`);
      
      const response = await axios.get(subscribeUrl);
      const channelName = response.data.channel;

      this.logger.info(`[PW_SUBSCRIPTION] Got channel: ${channelName}`);

      // Configure Pusher
      this.pusher = new Pusher('', {
        cluster: '',
        wsHost: 'socket.politicsandwar.com',
        wsPort: 443,
        wssPort: 443,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: 'https://api.politicsandwar.com/subscriptions/v1/auth',
        auth: {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      });

      // Subscribe to the channel
      this.channel = this.pusher.subscribe(channelName);

      // Handle war creation events
      this.channel.bind('WAR_CREATE', async (data: any) => {
        try {
          const warData: PWWar = JSON.parse(data.data);
          this.logger.info(`[PW_SUBSCRIPTION] War created: ${warData.attacker?.nation_name} attacked ${warData.defender?.nation_name}`);
          await this.handleWarAlert(warData);
        } catch (error) {
          this.logger.error('[PW_SUBSCRIPTION] Error processing war create event:', error);
        }
      });

      // Handle bulk events
      this.channel.bind('BULK_WAR_CREATE', async (data: any) => {
        try {
          const wars: PWWar[] = JSON.parse(data.data);
          this.logger.info(`[PW_SUBSCRIPTION] Received ${wars.length} bulk war create events`);
          for (const war of wars) {
            await this.handleWarAlert(war);
          }
        } catch (error) {
          this.logger.error('[PW_SUBSCRIPTION] Error processing bulk war create events:', error);
        }
      });

      // Handle connection events
      this.pusher.connection.bind('connected', () => {
        this.logger.info('[PW_SUBSCRIPTION] Connected to P&W websocket');
        this.reconnectAttempts = 0;
      });

      this.pusher.connection.bind('disconnected', () => {
        this.logger.warn('[PW_SUBSCRIPTION] Disconnected from P&W websocket');
        this.scheduleReconnect();
      });

      this.pusher.connection.bind('error', (error: any) => {
        this.logger.error('[PW_SUBSCRIPTION] Pusher connection error:', error);
        this.scheduleReconnect();
      });

    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Failed to subscribe to war events:', error);
      this.scheduleReconnect();
    }
  }

  private async handleWarAlert(war: PWWar) {
    try {
      // Check which alliances are involved (attacker or defender)
      const involvedAllianceIds = [
        war.att_alliance_id,
        war.def_alliance_id
      ].filter(id => id && id !== '0').map(id => parseInt(id));

      if (involvedAllianceIds.length === 0) {
        return; // No alliances involved
      }

      // Find Discord servers for these alliances
      const servers = await this.prisma.discordServer.findMany({
        where: {
          allianceId: {
            in: involvedAllianceIds
          },
          isActive: true
        },
        include: {
          alliance: true
        }
      });

      for (const server of servers) {
        // Get war alert channel configs for this server
        const warChannels = await this.prisma.channelConfig.findMany({
          where: {
            serverId: server.id,
            module: 'war',
            eventType: 'war_alerts',
            isActive: true
          }
        });
        
        for (const channelConfig of warChannels) {
          await this.sendWarAlert(server, channelConfig, war, server.allianceId!);
        }
      }

    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Error handling war alert:', error);
    }
  }

  private async sendWarAlert(server: any, channelConfig: any, war: PWWar, serverAllianceId: number) {
    try {
      // Import Discord client (we'll need to pass this in later)
      const { getDiscordClient } = await import('../index');
      const client = getDiscordClient();

      if (!client) {
        this.logger.error('[PW_SUBSCRIPTION] Discord client not available');
        return;
      }

      const channel = await client.channels.fetch(channelConfig.channelId);
      if (!channel || !channel.isTextBased()) {
        this.logger.error(`[PW_SUBSCRIPTION] Invalid channel: ${channelConfig.channelId}`);
        return;
      }

      // Determine if our alliance is the attacker or defender
      const isOurAllianceAttacker = parseInt(war.att_alliance_id) === serverAllianceId;
      const isOurAllianceDefender = parseInt(war.def_alliance_id) === serverAllianceId;
      
      if (!isOurAllianceAttacker && !isOurAllianceDefender) {
        return; // Not our alliance involved
      }

      const ourNation = isOurAllianceAttacker ? war.attacker : war.defender;
      const enemyNation = isOurAllianceAttacker ? war.defender : war.attacker;
      const warType = isOurAllianceAttacker ? 'OFFENSIVE' : 'DEFENSIVE';

      // Check if our nation is registered with the bot
      const user = await this.prisma.user.findFirst({
        where: {
          pwNationId: parseInt(ourNation.id)
        }
      });

      const userMention = user?.discordId ? `<@${user.discordId}>` : null;

      // Create war alert embed
      const embed = {
        title: `🚨 ${warType} WAR ALERT`,
        color: isOurAllianceAttacker ? 0xff6b35 : 0xff003c, // Orange for offensive, red for defensive
        description: `A new war has been declared!`,
        fields: [
          {
            name: '⚔️ War Details',
            value: `**War ID:** ${war.id}\n**Type:** ${war.war_type}\n**Reason:** ${war.reason || 'No reason given'}`,
            inline: false
          },
          {
            name: `${isOurAllianceAttacker ? '👑' : '🛡️'} Our Nation`,
            value: `**${ourNation.nation_name}** (${ourNation.leader_name})\n**Alliance:** ${ourNation.alliance?.name || 'None'} ${ourNation.alliance?.acronym ? `[${ourNation.alliance.acronym}]` : ''}`,
            inline: true
          },
          {
            name: `${isOurAllianceAttacker ? '🛡️' : '👑'} Enemy Nation`,
            value: `**${enemyNation.nation_name}** (${enemyNation.leader_name})\n**Alliance:** ${enemyNation.alliance?.name || 'None'} ${enemyNation.alliance?.acronym ? `[${enemyNation.alliance.acronym}]` : ''}`,
            inline: true
          }
        ],
        footer: {
          text: `War declared at ${new Date(war.date).toLocaleString()}`
        },
        timestamp: war.date
      };

      // Create thread for this war
      const threadName = `War Alert: ${ourNation.nation_name} vs ${enemyNation.nation_name}`;
      
      let content = `🚨 **${warType} WAR ALERT** 🚨\n\n`;
      
      if (userMention) {
        content += `${userMention} Your nation **${ourNation.nation_name}** ${isOurAllianceAttacker ? 'has declared war on' : 'is under attack by'} **${enemyNation.nation_name}**!\n\n`;
      } else {
        content += `⚠️ **${ourNation.nation_name}** ${isOurAllianceAttacker ? 'has declared war on' : 'is under attack by'} **${enemyNation.nation_name}**\n`;
        content += `*Note: This nation is not registered with the bot*\n\n`;
      }

      const message = await channel.send({
        content,
        embeds: [embed]
      });

      // Create a thread for discussion
      const thread = await message.startThread({
        name: threadName,
        autoArchiveDuration: 1440 // 24 hours
      });

      await thread.send({
        content: `💬 Discuss this war here! Use this thread for coordination and updates.\n\n` +
                `🔗 **Useful Links:**\n` +
                `• [View War](https://politicsandwar.com/nation/war/timeline/war=${war.id})\n` +
                `• [${ourNation.nation_name}](https://politicsandwar.com/nation/id=${ourNation.id})\n` +
                `• [${enemyNation.nation_name}](https://politicsandwar.com/nation/id=${enemyNation.id})`
      });

      this.logger.info(`[PW_SUBSCRIPTION] War alert sent to ${server.name} (${channelConfig.channelId})`);

    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Error sending war alert:', error);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('[PW_SUBSCRIPTION] Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.logger.info(`[PW_SUBSCRIPTION] Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      await this.initialize();
    }, delay);
  }

  async shutdown() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.logger.info('[PW_SUBSCRIPTION] Subscription service shutdown');
    }
  }
}