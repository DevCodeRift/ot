// Debug script to check war alerts system status

import { PrismaClient } from '@prisma/client';

async function debugWarAlerts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging War Alerts System...\n');

    // Check active Discord servers and their alliances
    console.log('📡 Checking active Discord servers:');
    const activeServers = await prisma.discordServer.findMany({
      where: {
        isActive: true,
        allianceId: { not: null }
      },
      include: {
        alliance: {
          include: {
            apiKey: true
          }
        }
      }
    });

    console.log(`Found ${activeServers.length} active Discord servers with alliances:`);
    
    for (const server of activeServers) {
      console.log(`  • Server: ${server.serverName} (${server.serverId})`);
      console.log(`    Alliance: ${server.alliance?.name} (ID: ${server.allianceId})`);
      console.log(`    Has API Key: ${server.alliance?.apiKey?.isActive ? '✅ YES' : '❌ NO'}`);
      
      if (server.alliance?.apiKey?.isActive) {
        console.log(`    API Key Name: ${server.alliance.apiKey.keyName || 'Unnamed'}`);
        console.log(`    Last Used: ${server.alliance.apiKey.lastUsed || 'Never'}`);
      }
    }

    // Check for war alert channel configurations
    console.log('\n📢 Checking war alert channel configurations:');
    const warChannels = await prisma.channelConfig.findMany({
      where: {
        module: 'war',
        eventType: 'war_alerts',
        isActive: true
      },
      include: {
        server: {
          include: {
            alliance: true
          }
        }
      }
    });

    console.log(`Found ${warChannels.length} configured war alert channels:`);
    
    for (const channel of warChannels) {
      console.log(`  • Channel: ${channel.channelId} (settings: ${JSON.stringify(channel.settings)})`);
      console.log(`    Server: ${channel.server.serverName} (${channel.server.serverId})`);
      console.log(`    Alliance: ${channel.server.alliance?.name || 'No alliance'}`);
    }

    // Check recent wars to see what we should be detecting
    console.log('\n⚔️ Checking recent wars in database:');
    const recentWars = await prisma.war.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        attacker: { select: { nationName: true, allianceName: true } },
        defender: { select: { nationName: true, allianceName: true } }
      }
    });

    console.log(`Found ${recentWars.length} recent wars in database:`);
    for (const war of recentWars) {
      console.log(`  • War ${war.id}: ${war.attacker?.nationName} vs ${war.defender?.nationName}`);
      console.log(`    Date: ${war.date}, Alliances: ${war.attacker?.allianceName} vs ${war.defender?.allianceName}`);
    }

    console.log('\n🔧 Recommendations:');
    
    const alliancesWithoutKeys = activeServers.filter(s => !s.alliance?.apiKey?.isActive);
    if (alliancesWithoutKeys.length > 0) {
      console.log('❌ Missing API keys for alliances:');
      for (const server of alliancesWithoutKeys) {
        console.log(`  • ${server.alliance?.name} (ID: ${server.allianceId}) - needs API key configuration`);
      }
    }

    if (warChannels.length === 0) {
      console.log('❌ No war alert channels configured - bot won\'t send alerts even if wars are detected');
    }

    const allianceIds = activeServers.map(s => s.allianceId).filter(id => id !== null);
    console.log(`\n📊 Summary:`);
    console.log(`  • Active alliances: ${allianceIds.length}`);
    console.log(`  • Alliances with API keys: ${activeServers.filter(s => s.alliance?.apiKey?.isActive).length}`);
    console.log(`  • War alert channels: ${warChannels.length}`);

  } catch (error) {
    console.error('❌ Error debugging war alerts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWarAlerts();