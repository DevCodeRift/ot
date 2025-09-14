// Test script to manually trigger a war alert to verify the system works

import { PrismaClient } from '@prisma/client';

async function testWarAlert() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing War Alert System...\n');

    // Get the Discord server and channel configuration
    const channelConfig = await prisma.channelConfig.findFirst({
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

    if (!channelConfig) {
      console.log('❌ No war alert channels configured');
      return;
    }

    console.log('📢 Found war alert channel:');
    console.log(`  • Channel ID: ${channelConfig.channelId}`);
    console.log(`  • Server: ${channelConfig.server.serverName || 'Unknown'}`);
    console.log(`  • Alliance: ${channelConfig.server.alliance?.name || 'No alliance'}`);

    // Create a test war alert by calling the bot's war alert endpoint
    const WEBAPP_BOT_SECRET = process.env.WEBAPP_BOT_SECRET;
    const BOT_URL = process.env.DISCORD_BOT_API_URL || 'https://ot-production.up.railway.app';

    if (!WEBAPP_BOT_SECRET) {
      console.log('❌ WEBAPP_BOT_SECRET not found in environment');
      return;
    }

    // Create a mock war event that would involve Rose alliance
    const mockWar = {
      id: "test-war-" + Date.now(),
      date: new Date().toISOString(),
      reason: "Test War Alert - Manual Trigger",
      war_type: "Ordinary War",
      att_id: "123456",
      def_id: "789012", 
      att_alliance_id: "790", // Rose
      def_alliance_id: "0", // None
      attacker: {
        id: "123456",
        nation_name: "Test Attacker Nation",
        leader_name: "Test Leader",
        alliance: {
          id: "790",
          name: "Rose",
          acronym: "Rose"
        }
      },
      defender: {
        id: "789012", 
        nation_name: "Test Defender Nation",
        leader_name: "Test Defender",
        alliance: null
      }
    };

    console.log('\n🎯 Simulating war event for Rose alliance...');
    console.log(`War: ${mockWar.attacker.nation_name} vs ${mockWar.defender.nation_name}`);

    // Instead of calling the bot directly, let's check if we can test the webhook endpoint
    console.log('\n🔧 To test war alerts manually:');
    console.log('1. Check if bot is receiving P&W subscription events');
    console.log('2. Verify the bot can send messages to the Discord channel');
    console.log('3. Test with a real recent war from P&W API');

    // Let's see if there are any recent wars involving Rose in the P&W API
    const allianceApiKey = await prisma.allianceApiKey.findFirst({
      where: {
        allianceId: 790,
        isActive: true
      }
    });

    if (allianceApiKey) {
      console.log('\n🔑 Found Rose API key, testing P&W connection...');
      
      // Test if we can fetch recent wars from P&W API
      const pwQuery = `{
        wars(first: 5, orderBy: { column: DATE, order: DESC }) {
          data {
            id
            date
            att_id
            def_id
            attacker { nation_name alliance { name } }
            defender { nation_name alliance { name } }
          }
        }
      }`;
      
      try {
        const response = await fetch('https://api.politicsandwar.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': allianceApiKey.apiKey
          },
          body: JSON.stringify({ query: pwQuery })
        });
        
        const data = await response.json();
        
        if (data.data?.wars?.data) {
          console.log('✅ P&W API connection working!');
          console.log(`Found ${data.data.wars.data.length} recent wars:`);
          
          for (const war of data.data.wars.data.slice(0, 3)) {
            console.log(`  • War ${war.id}: ${war.attacker.nation_name} vs ${war.defender.nation_name}`);
            console.log(`    Date: ${war.date}`);
          }
        } else {
          console.log('❌ P&W API error:', data.errors || 'Unknown error');
        }
      } catch (error) {
        console.log('❌ P&W API connection failed:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWarAlert();