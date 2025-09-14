// Fixed P&W subscription service that uses URL parameters instead of headers

import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';

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

export class FixedPWSubscriptionService {
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private isMonitoring = false;
  private apiKey: string | null = null;
  private allianceIds: number[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCheckedWarId: string | null = null;

  constructor(prisma: PrismaClient, logger: winston.Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async initialize() {
    try {
      this.logger.info('[FIXED_PW_SUBSCRIPTION] Initializing fixed P&W subscription service...');
      
      // Get active alliances from Discord servers
      const activeServers = await this.prisma.discordServer.findMany({
        where: {
          isActive: true,
          allianceId: { not: null }
        },
        select: { allianceId: true },
        distinct: ['allianceId']
      });

      this.allianceIds = activeServers
        .map(server => server.allianceId)
        .filter(id => id !== null) as number[];

      if (this.allianceIds.length === 0) {
        this.logger.warn('[FIXED_PW_SUBSCRIPTION] No active alliances found, skipping war alerts setup');
        return;
      }

      this.logger.info(`[FIXED_PW_SUBSCRIPTION] Found active alliances: ${this.allianceIds.join(', ')}`);

      // Get P&W API key from webapp for the first alliance
      this.apiKey = await this.getApiKeyFromWebapp(this.allianceIds[0]);
      
      if (!this.apiKey) {
        this.logger.warn('[FIXED_PW_SUBSCRIPTION] No P&W API key available, war alerts will be disabled');
        return;
      }

      this.logger.info('[FIXED_PW_SUBSCRIPTION] P&W API key configured from webapp');

      // Start polling for new wars instead of using broken pnwkit subscriptions
      await this.startWarPolling();
      
    } catch (error) {
      this.logger.error('[FIXED_PW_SUBSCRIPTION] Failed to initialize:', error);
      throw error;
    }
  }

  private async getApiKeyFromWebapp(allianceId: number): Promise<string | null> {
    try {
      const webappUrl = process.env.WEBAPP_API_URL || 'http://localhost:3000';
      const response = await fetch(`${webappUrl}/api/bot/alliance-api-key?allianceId=${allianceId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
        }
      });

      if (!response.ok) {
        this.logger.warn(`[FIXED_PW_SUBSCRIPTION] Failed to get API key for alliance ${allianceId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data.success && data.apiKey) {
        this.logger.info(`[FIXED_PW_SUBSCRIPTION] Got alliance-specific API key for ${data.allianceName} (${data.allianceAcronym}) - monitoring enabled`);
        return data.apiKey;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`[FIXED_PW_SUBSCRIPTION] Error fetching API key for alliance ${allianceId}:`, error);
      return null;
    }
  }

  private async startWarPolling() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.logger.info('[FIXED_PW_SUBSCRIPTION] Starting war polling with URL parameter format');

    // Get the latest war ID to start from
    await this.initializeLastWarId();

    // Poll every 30 seconds for new wars
    this.pollingInterval = setInterval(async () => {
      await this.checkForNewWars();
    }, 30000);

    // Also check immediately
    await this.checkForNewWars();
  }

  private async initializeLastWarId() {
    try {
      const query = `{
        wars(first: 1, orderBy: { column: DATE, order: DESC }) {
          data {
            id
          }
        }
      }`;

      const response = await fetch(`https://api.politicsandwar.com/graphql?api_key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.data?.wars?.data?.[0]) {
        this.lastCheckedWarId = data.data.wars.data[0].id;
        this.logger.info(`[FIXED_PW_SUBSCRIPTION] Initialized with latest war ID: ${this.lastCheckedWarId}`);
      }
    } catch (error) {
      this.logger.error('[FIXED_PW_SUBSCRIPTION] Failed to initialize last war ID:', error);
    }
  }

  private async checkForNewWars() {
    try {
      const query = `{
        wars(first: 10, orderBy: { column: DATE, order: DESC }) {
          data {
            id
            date
            reason
            war_type
            att_id
            def_id
            att_alliance_id
            def_alliance_id
            attacker { 
              nation_name 
              alliance { name acronym }
            }
            defender { 
              nation_name 
              alliance { name acronym }
            }
          }
        }
      }`;

      const response = await fetch(`https://api.politicsandwar.com/graphql?api_key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();

      if (data.errors) {
        this.logger.error('[FIXED_PW_SUBSCRIPTION] P&W API error:', data.errors);
        return;
      }

      if (data.data?.wars?.data) {
        const wars = data.data.wars.data;
        const newWars = [];

        for (const war of wars) {
          if (this.lastCheckedWarId && war.id <= this.lastCheckedWarId) {
            break; // We've reached wars we've already processed
          }
          
          // Check if this war involves any of our alliances
          const attAllianceId = parseInt(war.att_alliance_id) || 0;
          const defAllianceId = parseInt(war.def_alliance_id) || 0;
          
          if (this.allianceIds.includes(attAllianceId) || this.allianceIds.includes(defAllianceId)) {
            newWars.push(war);
          }
        }

        if (newWars.length > 0) {
          this.logger.info(`[FIXED_PW_SUBSCRIPTION] Found ${newWars.length} new wars involving tracked alliances`);
          
          // Update last checked war ID
          this.lastCheckedWarId = wars[0].id;
          
          // Process the new wars
          await this.handleWarEvents(newWars, this.allianceIds);
        }
      }
    } catch (error) {
      this.logger.error('[FIXED_PW_SUBSCRIPTION] Error checking for new wars:', error);
    }
  }

  private async handleWarEvents(wars: any[], allianceIds: number[]) {
    this.logger.info(`[FIXED_PW_SUBSCRIPTION] Processing ${wars.length} war events`);
    
    for (const warData of wars) {
      try {
        const war = this.parseWarData(warData);
        await this.handleWarAlert(war);
      } catch (error) {
        this.logger.error('[FIXED_PW_SUBSCRIPTION] Error processing war event:', error);
      }
    }
  }

  private parseWarData(warData: any): War {
    return {
      id: warData.id,
      date: warData.date,
      reason: warData.reason || 'No reason provided',
      war_type: warData.war_type || 'Unknown',
      att_id: warData.att_id,
      def_id: warData.def_id,
      att_alliance_id: warData.att_alliance_id || '0',
      def_alliance_id: warData.def_alliance_id || '0',
      attacker: {
        id: warData.att_id,
        nation_name: warData.attacker?.nation_name || 'Unknown Nation',
        leader_name: 'Unknown Leader',
        alliance: warData.attacker?.alliance ? {
          id: warData.att_alliance_id || '0',
          name: warData.attacker.alliance.name,
          acronym: warData.attacker.alliance.acronym
        } : undefined
      },
      defender: {
        id: warData.def_id,
        nation_name: warData.defender?.nation_name || 'Unknown Nation',
        leader_name: 'Unknown Leader',
        alliance: warData.defender?.alliance ? {
          id: warData.def_alliance_id || '0',
          name: warData.defender.alliance.name,
          acronym: warData.defender.alliance.acronym
        } : undefined
      }
    };
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
      this.logger.error('[FIXED_PW_SUBSCRIPTION] Error handling war alert:', error);
    }
  }

  private async sendWarAlert(server: any, channelConfig: any, war: War, allianceId: number) {
    try {
      // Import Discord client
      const { client } = await import('../index');
      
      const channel = client.channels.cache.get(channelConfig.channelId);
      if (!channel || !channel.isTextBased()) {
        this.logger.warn(`[FIXED_PW_SUBSCRIPTION] Invalid channel: ${channelConfig.channelId}`);
        return;
      }

      // Determine if this alliance is attacking or defending
      const isAttacker = parseInt(war.att_alliance_id) === allianceId;
      const role = isAttacker ? 'Attacker' : 'Defender';
      const opponent = isAttacker ? war.defender : war.attacker;
      
      const embed = {
        title: '⚔️ War Alert',
        color: isAttacker ? 0xff6b35 : 0xff003c, // Orange for attacking, red for defending
        fields: [
          {
            name: `${role}: ${isAttacker ? war.attacker.nation_name : war.defender.nation_name}`,
            value: `Alliance: ${isAttacker ? war.attacker.alliance?.name || 'None' : war.defender.alliance?.name || 'None'}`,
            inline: true
          },
          {
            name: `Opponent: ${opponent.nation_name}`,
            value: `Alliance: ${opponent.alliance?.name || 'None'}`,
            inline: true
          },
          {
            name: 'War Details',
            value: `**Type:** ${war.war_type}\n**Reason:** ${war.reason}\n**War ID:** ${war.id}`,
            inline: false
          }
        ],
        timestamp: new Date(war.date).toISOString(),
        footer: {
          text: `${server.alliance?.name || 'Alliance'} War Alerts`
        }
      };

      await channel.send({ embeds: [embed] });
      this.logger.info(`[FIXED_PW_SUBSCRIPTION] Sent war alert for war ${war.id} to channel ${channelConfig.channelId}`);
      
    } catch (error) {
      this.logger.error('[FIXED_PW_SUBSCRIPTION] Error sending war alert:', error);
    }
  }

  public stop() {
    this.isMonitoring = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.logger.info('[FIXED_PW_SUBSCRIPTION] War monitoring stopped');
  }
}