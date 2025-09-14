// P&W subscription service using official P&W subscription API with Pusher

import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';
import Pusher from 'pusher-js';

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

export class PWSubscriptionService {
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private isMonitoring = false;
  private apiKey: string | null = null;
  private allianceIds: number[] = [];
  private pusher: Pusher | null = null;
  private warChannel: any = null;

  constructor(prisma: PrismaClient, logger: winston.Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async initialize() {
    try {
      this.logger.info('[PW_SUBSCRIPTION] Initializing P&W subscription service with official API...');
      
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
        this.logger.warn('[PW_SUBSCRIPTION] No active alliances found, skipping war alerts setup');
        return;
      }

      this.logger.info(`[PW_SUBSCRIPTION] Found active alliances: ${this.allianceIds.join(', ')}`);

      // Get P&W API key from webapp for the first alliance
      this.apiKey = await this.getApiKeyFromWebapp(this.allianceIds[0]);
      
      if (!this.apiKey) {
        this.logger.warn('[PW_SUBSCRIPTION] No P&W API key available, war alerts will be disabled');
        return;
      }

      this.logger.info('[PW_SUBSCRIPTION] P&W API key configured from webapp');

      // Start real-time war subscriptions
      await this.startWarSubscriptions();
      
    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Failed to initialize:', error);
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
        this.logger.warn(`[PW_SUBSCRIPTION] Failed to get API key for alliance ${allianceId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data.success && data.apiKey) {
        this.logger.info(`[PW_SUBSCRIPTION] Got alliance-specific API key for ${data.allianceName} (${data.allianceAcronym}) - monitoring enabled`);
        return data.apiKey;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`[PW_SUBSCRIPTION] Error fetching API key for alliance ${allianceId}:`, error);
      return null;
    }
  }

  private async startWarSubscriptions() {
    if (this.isMonitoring) return;
    
    try {
      this.isMonitoring = true;
      this.logger.info('[PW_SUBSCRIPTION] Starting real-time war subscriptions...');

      // Step 1: Subscribe to war events using P&W subscription API
      const subscribeUrl = `https://api.politicsandwar.com/subscriptions/v1/subscribe/war/create?api_key=${this.apiKey}`;
      
      this.logger.info('[PW_SUBSCRIPTION] Requesting subscription channel...');
      const response = await fetch(subscribeUrl, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to subscribe to war events: ${response.status} ${response.statusText}`);
      }

      const subscriptionData = await response.json();
      const channelName = subscriptionData.channel;
      
      if (!channelName) {
        throw new Error('No channel name returned from subscription API');
      }

      this.logger.info(`[PW_SUBSCRIPTION] Got subscription channel: ${channelName}`);

      // Step 2: Configure Pusher client with P&W settings
      this.pusher = new Pusher("a22734a47847a64386c8", {
        wsHost: "socket.politicsandwar.com",
        cluster: "us2", // Required by pusher-js but not used by P&W
        disableStats: true,
        authEndpoint: "https://api.politicsandwar.com/subscriptions/v1/auth",
      });

      // Step 3: Subscribe to the channel
      this.warChannel = this.pusher.subscribe(channelName);

      // Step 4: Bind to war creation events
      this.warChannel.bind('WAR_CREATE', (data: any) => {
        this.logger.info('[PW_SUBSCRIPTION] Received WAR_CREATE event');
        this.logger.info('[PW_SUBSCRIPTION] WAR_CREATE raw data:', JSON.stringify(data, null, 2));
        this.handleWarCreateEvent(data);
      });

      // Also bind to bulk events in case they're used
      this.warChannel.bind('BULK_WAR_CREATE', (data: any) => {
        this.logger.info('[PW_SUBSCRIPTION] Received BULK_WAR_CREATE event');
        this.logger.info('[PW_SUBSCRIPTION] BULK_WAR_CREATE raw data:', JSON.stringify(data, null, 2));
        this.handleBulkWarCreateEvent(data);
      });

      // Handle connection events
      this.pusher.connection.bind('connected', () => {
        this.logger.info('[PW_SUBSCRIPTION] ✅ Connected to P&W real-time events');
      });

      this.pusher.connection.bind('disconnected', () => {
        this.logger.warn('[PW_SUBSCRIPTION] ❌ Disconnected from P&W real-time events');
      });

      this.pusher.connection.bind('error', (error: any) => {
        this.logger.error('[PW_SUBSCRIPTION] Pusher connection error:', error);
      });

      this.logger.info('[PW_SUBSCRIPTION] ✅ War subscriptions active - waiting for events...');

    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Failed to start war subscriptions:', error);
      this.isMonitoring = false;
    }
  }

  private async handleWarCreateEvent(data: any) {
    try {
      this.logger.info('[PW_SUBSCRIPTION] Processing war create event');
      this.logger.info('[PW_SUBSCRIPTION] War event data structure:', JSON.stringify(data, null, 2));
      
      // Try different ways to access the war data
      let warData = null;
      
      // Option 1: Direct data access
      if (data && typeof data === 'object' && !data.data) {
        warData = data;
        this.logger.info('[PW_SUBSCRIPTION] Using direct data access for war');
      }
      
      // Option 2: data.data property
      if (!warData && data.data) {
        warData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        this.logger.info('[PW_SUBSCRIPTION] Using data.data property for war');
      }
      
      this.logger.info('[PW_SUBSCRIPTION] Final war data:', JSON.stringify(warData, null, 2));
      
      if (!warData || !warData.id) {
        this.logger.warn('[PW_SUBSCRIPTION] Invalid war data - missing id');
        return;
      }
      
      // Check if this war involves any of our tracked alliances
      const attAllianceId = parseInt(warData.att_alliance_id) || 0;
      const defAllianceId = parseInt(warData.def_alliance_id) || 0;
      
      this.logger.info(`[PW_SUBSCRIPTION] War ${warData.id}: attacker alliance ${attAllianceId}, defender alliance ${defAllianceId}`);
      this.logger.info(`[PW_SUBSCRIPTION] Tracking alliances: ${this.allianceIds.join(', ')}`);
      
      const isAllianceInvolved = this.allianceIds.includes(attAllianceId) || this.allianceIds.includes(defAllianceId);
      this.logger.info(`[PW_SUBSCRIPTION] Alliance involved: ${isAllianceInvolved}`);
      
      if (isAllianceInvolved) {
        this.logger.info(`[PW_SUBSCRIPTION] Alliance war detected! War ID: ${warData.id}`);
        
        // Convert to our War interface format
        const war = this.parseWarData(warData);
        
        // Send war alert
        await this.handleWarAlert(war);
      } else {
        this.logger.info(`[PW_SUBSCRIPTION] War ${warData.id} doesn't involve tracked alliances (${attAllianceId}, ${defAllianceId})`);
      }
      
    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Error processing war create event:', error);
      this.logger.error('[PW_SUBSCRIPTION] Error details:', error);
    }
  }

  private async handleBulkWarCreateEvent(data: any) {
    try {
      this.logger.info('[PW_SUBSCRIPTION] Processing bulk war create event');
      this.logger.info('[PW_SUBSCRIPTION] Raw data received:', JSON.stringify(data, null, 2));
      
      // Try different ways to access the data
      let warsData = null;
      
      // Option 1: Direct data access
      if (data && typeof data === 'object') {
        warsData = data;
        this.logger.info('[PW_SUBSCRIPTION] Using direct data access');
      }
      
      // Option 2: data.data property
      if (!warsData && data.data) {
        warsData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        this.logger.info('[PW_SUBSCRIPTION] Using data.data property');
      }
      
      // Option 3: Check for wars property
      if (!warsData && data.wars) {
        warsData = data.wars;
        this.logger.info('[PW_SUBSCRIPTION] Using data.wars property');
      }
      
      this.logger.info('[PW_SUBSCRIPTION] Final wars data:', JSON.stringify(warsData, null, 2));
      
      if (Array.isArray(warsData)) {
        this.logger.info(`[PW_SUBSCRIPTION] Processing ${warsData.length} wars from bulk event`);
        for (const warData of warsData) {
          // Process each war individually
          await this.handleWarCreateEvent({ data: warData });
        }
      } else if (warsData && typeof warsData === 'object') {
        this.logger.info('[PW_SUBSCRIPTION] Non-array wars data, processing as single war');
        await this.handleWarCreateEvent({ data: warsData });
      } else {
        this.logger.warn('[PW_SUBSCRIPTION] No wars data found in bulk event');
        this.logger.info('[PW_SUBSCRIPTION] Available properties:', Object.keys(data || {}));
      }
      
    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Error processing bulk war create event:', error);
      this.logger.error('[PW_SUBSCRIPTION] Error details:', error);
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
        leader_name: warData.attacker?.leader_name || 'Unknown Leader',
        alliance: warData.attacker?.alliance ? {
          id: warData.att_alliance_id || '0',
          name: warData.attacker.alliance.name,
          acronym: warData.attacker.alliance.acronym
        } : undefined
      },
      defender: {
        id: warData.def_id,
        nation_name: warData.defender?.nation_name || 'Unknown Nation',
        leader_name: warData.defender?.leader_name || 'Unknown Leader',
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
      this.logger.error('[PW_SUBSCRIPTION] Error handling war alert:', error);
    }
  }

  private async sendWarAlert(server: any, channelConfig: any, war: War, allianceId: number) {
    try {
      // Import Discord client
      const { client } = await import('../index');
      
      const channel = client.channels.cache.get(channelConfig.channelId);
      if (!channel || !channel.isTextBased()) {
        this.logger.warn(`[PW_SUBSCRIPTION] Invalid channel: ${channelConfig.channelId}`);
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
      this.logger.info(`[PW_SUBSCRIPTION] ✅ Sent war alert for war ${war.id} to channel ${channelConfig.channelId}`);
      
    } catch (error) {
      this.logger.error('[PW_SUBSCRIPTION] Error sending war alert:', error);
    }
  }

  public stop() {
    this.isMonitoring = false;
    
    if (this.warChannel) {
      this.warChannel.unbind_all();
      this.pusher?.unsubscribe(this.warChannel.name);
      this.warChannel = null;
    }
    
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    
    this.logger.info('[PW_SUBSCRIPTION] War monitoring stopped');
  }
}