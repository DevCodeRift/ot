import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';
import pnwkit from 'pnwkit-2.0';
import { subscriptionModel, subscriptionEvent } from 'pnwkit-2.0/build/src/interfaces/subscriptions';

interface War {
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

export class PWKitSubscriptionService {
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private isSubscribed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  constructor(prisma: PrismaClient, logger: winston.Logger) {
    this.prisma = prisma;
    this.logger = logger;
    
    // Note: No global API key required - will get per-alliance keys from webapp
  }

  async initialize() {
    try {
      this.logger.info('[PNWKIT_SUBSCRIPTION] Initializing pnwkit subscription service...');
      this.logger.info('[PNWKIT_SUBSCRIPTION] P&W API keys will be obtained per-alliance from webapp');
      
      // Service is now ready but won't subscribe until we have alliance-specific API keys
      this.logger.info('[PNWKIT_SUBSCRIPTION] Service initialized (waiting for alliance-specific API keys)');
      
    } catch (error) {
      this.logger.error('[PNWKIT_SUBSCRIPTION] Failed to initialize:', error);
      throw error;
    }
  }

  private async subscribeToWarEvents(allianceIds: number[]) {
    try {
      this.logger.info(`[PNWKIT_SUBSCRIPTION] Subscribing to war events for alliances: ${allianceIds.join(', ')}`);
      
      // Get subscription channel for war create events with filters
      const channel = await pnwkit.subscriptionChannel(
        subscriptionModel.WAR, 
        subscriptionEvent.CREATE,
        {
          att_alliance_id: allianceIds,
          def_alliance_id: allianceIds
        }
      );
      
      this.logger.info(`[PNWKIT_SUBSCRIPTION] Got subscription channel: ${channel}`);

      // Set up war subscription with callback
      await pnwkit.warSubscription(
        channel,
        subscriptionEvent.CREATE,
        (wars: any[]) => this.handleWarEvents(wars, allianceIds)
      );

      this.isSubscribed = true;
      this.reconnectAttempts = 0;
      this.logger.info('[PNWKIT_SUBSCRIPTION] Successfully subscribed to war events');

    } catch (error) {
      this.logger.error('[PNWKIT_SUBSCRIPTION] Failed to subscribe to war events:', error);
      this.scheduleReconnect();
    }
  }

  private async handleWarEvents(wars: any[], allianceIds: number[]) {
    try {
      this.logger.info(`[PNWKIT_SUBSCRIPTION] Received ${wars.length} war event(s)`);
      
      for (const warData of wars) {
        // Convert pnwkit war data to our format
        const war = await this.enrichWarData(warData);
        
        // Check if this war involves any of our alliances
        const involvedAllianceIds = [
          parseInt(war.att_alliance_id),
          parseInt(war.def_alliance_id)
        ].filter(id => !isNaN(id) && allianceIds.includes(id));

        if (involvedAllianceIds.length > 0) {
          this.logger.info(`[PNWKIT_SUBSCRIPTION] Processing war: ${war.attacker?.nation_name} vs ${war.defender?.nation_name}`);
          await this.handleWarAlert(war);
        }
      }
    } catch (error) {
      this.logger.error('[PNWKIT_SUBSCRIPTION] Error processing war events:', error);
    }
  }

  private async enrichWarData(warData: any): Promise<War> {
    try {
      // Use pnwkit to fetch detailed nation and alliance data
      const [attackerData, defenderData] = await Promise.all([
        pnwkit.nationQuery(
          { id: [parseInt(warData.att_id)], first: 1 },
          `id nation_name leader_name alliance_id alliance { id name acronym }`
        ),
        pnwkit.nationQuery(
          { id: [parseInt(warData.def_id)], first: 1 },
          `id nation_name leader_name alliance_id alliance { id name acronym }`
        )
      ]);

      const attacker = attackerData[0];
      const defender = defenderData[0];

      return {
        id: warData.id,
        date: warData.date,
        reason: warData.reason || 'No reason provided',
        war_type: warData.war_type,
        att_id: warData.att_id,
        def_id: warData.def_id,
        att_alliance_id: warData.att_alliance_id || '0',
        def_alliance_id: warData.def_alliance_id || '0',
        attacker: {
          id: attacker.id,
          nation_name: attacker.nation_name,
          leader_name: attacker.leader_name,
          alliance: attacker.alliance ? {
            id: attacker.alliance.id,
            name: attacker.alliance.name,
            acronym: attacker.alliance.acronym
          } : undefined
        },
        defender: {
          id: defender.id,
          nation_name: defender.nation_name,
          leader_name: defender.leader_name,
          alliance: defender.alliance ? {
            id: defender.alliance.id,
            name: defender.alliance.name,
            acronym: defender.alliance.acronym
          } : undefined
        }
      };
    } catch (error) {
      this.logger.error('[PNWKIT_SUBSCRIPTION] Error enriching war data:', error);
      
      // Fallback to basic data if enrichment fails
      return {
        id: warData.id,
        date: warData.date,
        reason: warData.reason || 'No reason provided',
        war_type: warData.war_type,
        att_id: warData.att_id,
        def_id: warData.def_id,
        att_alliance_id: warData.att_alliance_id || '0',
        def_alliance_id: warData.def_alliance_id || '0',
        attacker: {
          id: warData.att_id,
          nation_name: 'Unknown Nation',
          leader_name: 'Unknown Leader'
        },
        defender: {
          id: warData.def_id,
          nation_name: 'Unknown Nation',
          leader_name: 'Unknown Leader'
        }
      };
    }
  }

  private async handleWarAlert(war: War) {
    try {
      // Check which alliances are involved (attacker or defender)
      const involvedAllianceIds = [
        war.att_alliance_id,
        war.def_alliance_id
      ].filter(id => id && id !== '0').map(id => parseInt(id));

      if (involvedAllianceIds.length === 0) {
        return; // No alliances involved
      }

      // Find Discord servers for these alliances with war alert channels configured
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
      this.logger.error('[PNWKIT_SUBSCRIPTION] Error handling war alert:', error);
    }
  }

  private async sendWarAlert(server: any, channelConfig: any, war: War, serverAllianceId: number) {
    try {
      // Import Discord client
      const { getDiscordClient } = await import('../index');
      const client = getDiscordClient();

      if (!client) {
        this.logger.error('[PNWKIT_SUBSCRIPTION] Discord client not available');
        return;
      }

      const channel = await client.channels.fetch(channelConfig.channelId);
      if (!channel || !channel.isTextBased()) {
        this.logger.error(`[PNWKIT_SUBSCRIPTION] Invalid channel: ${channelConfig.channelId}`);
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

      // Create enhanced war alert embed with richer data
      const embed = {
        title: `🚨 ${warType} WAR ALERT`,
        color: isOurAllianceAttacker ? 0xff6b35 : 0xff003c, // Orange for offensive, red for defensive
        description: `A new ${war.war_type.toLowerCase()} war has been declared!`,
        fields: [
          {
            name: '⚔️ War Details',
            value: `**War ID:** [${war.id}](https://politicsandwar.com/nation/war/timeline/war=${war.id})\n**Type:** ${war.war_type}\n**Reason:** ${war.reason}`,
            inline: false
          },
          {
            name: `${isOurAllianceAttacker ? '👑' : '🛡️'} Our Nation`,
            value: `**[${ourNation.nation_name}](https://politicsandwar.com/nation/id=${ourNation.id})** (${ourNation.leader_name})\n**Alliance:** ${ourNation.alliance?.name || 'None'} ${ourNation.alliance?.acronym ? `[${ourNation.alliance.acronym}]` : ''}`,
            inline: true
          },
          {
            name: `${isOurAllianceAttacker ? '🛡️' : '👑'} Enemy Nation`,
            value: `**[${enemyNation.nation_name}](https://politicsandwar.com/nation/id=${enemyNation.id})** (${enemyNation.leader_name})\n**Alliance:** ${enemyNation.alliance?.name || 'None'} ${enemyNation.alliance?.acronym ? `[${enemyNation.alliance.acronym}]` : ''}`,
            inline: true
          }
        ],
        footer: {
          text: `War declared • Powered by pnwkit-2.0`
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
        content += `*Note: This nation is not registered with the bot. Use \`/register\` to receive direct pings.*\n\n`;
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
        content: `💬 **War Coordination Thread**\n\n` +
                `Use this thread for war planning, coordination, and updates!\n\n` +
                `🔗 **Quick Links:**\n` +
                `• [View War Timeline](https://politicsandwar.com/nation/war/timeline/war=${war.id})\n` +
                `• [${ourNation.nation_name}](https://politicsandwar.com/nation/id=${ourNation.id})\n` +
                `• [${enemyNation.nation_name}](https://politicsandwar.com/nation/id=${enemyNation.id})\n\n` +
                `📊 **War Type:** ${war.war_type}\n` +
                `📝 **Reason:** ${war.reason}`
      });

      this.logger.info(`[PNWKIT_SUBSCRIPTION] War alert sent to ${server.name} (${channelConfig.channelId})`);

    } catch (error) {
      this.logger.error('[PNWKIT_SUBSCRIPTION] Error sending war alert:', error);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('[PNWKIT_SUBSCRIPTION] Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.logger.info(`[PNWKIT_SUBSCRIPTION] Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      await this.initialize();
    }, delay);
  }

  async shutdown() {
    if (this.isSubscribed) {
      // pnwkit handles cleanup automatically
      this.isSubscribed = false;
      this.logger.info('[PNWKIT_SUBSCRIPTION] Subscription service shutdown');
    }
  }

  // Additional utility methods using pnwkit
  async getNationDetails(nationId: number) {
    try {
      const nations = await pnwkit.nationQuery(
        { id: [nationId], first: 1 },
        `id nation_name leader_name alliance_id cities score soldiers tanks aircraft ships 
         alliance { id name acronym } wars { id war_type turns_left }`
      );
      
      return nations[0];
    } catch (error) {
      this.logger.error(`[PNWKIT_SUBSCRIPTION] Error fetching nation details for ${nationId}:`, error);
      return null;
    }
  }

  async getAllianceMembers(allianceId: number) {
    try {
      const nations = await pnwkit.nationQuery(
        { alliance_id: [allianceId], first: 1000 },
        `id nation_name leader_name score cities last_active alliance_position`
      );
      
      return nations;
    } catch (error) {
      this.logger.error(`[PNWKIT_SUBSCRIPTION] Error fetching alliance members for ${allianceId}:`, error);
      return [];
    }
  }
}