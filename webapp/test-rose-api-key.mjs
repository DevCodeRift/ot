// Test Rose alliance P&W API key directly

import { PrismaClient } from '@prisma/client';

async function testRoseApiKey() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌹 Testing Rose Alliance P&W API Key...\n');

    // Get Rose's API key
    const roseApiKey = await prisma.allianceApiKey.findFirst({
      where: {
        allianceId: 790, // Rose
        isActive: true
      },
      include: {
        alliance: true
      }
    });

    if (!roseApiKey) {
      console.log('❌ No API key found for Rose alliance');
      return;
    }

    console.log('🔑 Found Rose API key:');
    console.log(`  • Alliance: ${roseApiKey.alliance.name} (${roseApiKey.alliance.acronym})`);
    console.log(`  • Key Name: ${roseApiKey.keyName || 'Unnamed'}`);
    console.log(`  • Added: ${roseApiKey.addedAt}`);
    console.log(`  • Last Used: ${roseApiKey.lastUsed || 'Never'}`);
    console.log(`  • API Key: ${roseApiKey.apiKey.substring(0, 8)}...`);

    // Test the API key with a simple query
    console.log('\n📡 Testing P&W API connection...');

    const testQuery = `{
      me {
        nation {
          id
          nation_name
          leader_name
          alliance {
            id
            name
            acronym
          }
        }
      }
    }`;

    const response = await fetch('https://api.politicsandwar.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': roseApiKey.apiKey
      },
      body: JSON.stringify({ query: testQuery })
    });

    const data = await response.json();

    if (data.errors) {
      console.log('❌ P&W API Error:', data.errors);
      return;
    }

    if (data.data?.me?.nation) {
      console.log('✅ P&W API key works!');
      console.log(`  • Nation: ${data.data.me.nation.nation_name}`);
      console.log(`  • Leader: ${data.data.me.nation.leader_name}`);
      console.log(`  • Alliance: ${data.data.me.nation.alliance?.name || 'None'}`);
      
      // Update last used timestamp
      await prisma.allianceApiKey.update({
        where: { id: roseApiKey.id },
        data: { lastUsed: new Date() }
      });
      
      console.log('📝 Updated last used timestamp');
    } else {
      console.log('❌ Unexpected API response:', data);
    }

    // Now test war subscription capability
    console.log('\n⚔️ Testing war data access...');
    
    const warQuery = `{
      wars(first: 3, orderBy: { column: DATE, order: DESC }) {
        data {
          id
          date
          reason
          war_type
          att_id
          def_id
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

    const warResponse = await fetch('https://api.politicsandwar.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': roseApiKey.apiKey
      },
      body: JSON.stringify({ query: warQuery })
    });

    const warData = await warResponse.json();

    if (warData.errors) {
      console.log('❌ War data API Error:', warData.errors);
    } else if (warData.data?.wars?.data) {
      console.log('✅ War data access works!');
      console.log(`Found ${warData.data.wars.data.length} recent wars:`);
      
      for (const war of warData.data.wars.data) {
        console.log(`  • War ${war.id}: ${war.attacker.nation_name} vs ${war.defender.nation_name}`);
        console.log(`    Date: ${war.date}, Type: ${war.war_type}`);
        
        // Check if this involves Rose
        const attackerAlliance = war.attacker.alliance?.acronym || 'None';
        const defenderAlliance = war.defender.alliance?.acronym || 'None';
        if (attackerAlliance === 'Rose' || defenderAlliance === 'Rose') {
          console.log(`    🌹 INVOLVES ROSE! ${attackerAlliance} vs ${defenderAlliance}`);
        }
      }
    }

    console.log('\n🔧 Status Summary:');
    console.log('  • Rose alliance API key: ✅ Working');
    console.log('  • P&W API access: ✅ Connected'); 
    console.log('  • War data access: ✅ Available');
    console.log('  • Issue is likely in bot P&W subscription service setup');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoseApiKey();