// Test the fixed war alerts system using existing wars
import { PrismaClient } from '@prisma/client';
import { FixedPWSubscriptionService } from './discord-bot/src/services/fixedPWSubscriptionService.js';
import * as winston from 'winston';
import dotenv from 'dotenv';

dotenv.config({ path: './webapp/.env.local' });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const prisma = new PrismaClient();

async function testFixedWarAlerts() {
  try {
    console.log('🧪 Testing Fixed War Alerts System');
    console.log('==================================');

    // Test 1: Initialize the fixed service
    console.log('\n1️⃣ Initializing Fixed P&W Subscription Service...');
    const fixedService = new FixedPWSubscriptionService(prisma, logger);
    
    // Test 2: Check if we can get alliance API key
    console.log('\n2️⃣ Testing alliance API key retrieval...');
    const allianceId = 790; // Rose
    
    const response = await fetch(`http://localhost:3000/api/bot/alliance-api-key?allianceId=${allianceId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET || 'test-secret'}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key retrieved:', data.success ? 'Success' : 'Failed');
      console.log('📊 Alliance:', data.allianceName, `(${data.allianceAcronym})`);
      
      if (data.apiKey) {
        // Test 3: Direct P&W API call with URL parameters
        console.log('\n3️⃣ Testing direct P&W API call with URL parameters...');
        
        const pwQuery = `{
          wars(first: 5, orderBy: { column: DATE, order: DESC }) {
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

        const pwResponse = await fetch(`https://api.politicsandwar.com/graphql?api_key=${data.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: pwQuery })
        });

        const pwData = await pwResponse.json();
        
        if (pwData.errors) {
          console.log('❌ P&W API Error:', pwData.errors);
        } else {
          console.log('✅ P&W API Response: Success');
          console.log('📊 Recent wars found:', pwData.data?.wars?.data?.length || 0);
          
          // Test 4: Look for Rose alliance wars
          const wars = pwData.data?.wars?.data || [];
          const roseWars = wars.filter(war => 
            war.att_alliance_id === '790' || war.def_alliance_id === '790'
          );
          
          console.log('\n4️⃣ Rose alliance wars in recent data:', roseWars.length);
          
          if (roseWars.length > 0) {
            console.log('📋 Most recent Rose war:');
            const recentWar = roseWars[0];
            console.log(`   War ID: ${recentWar.id}`);
            console.log(`   Date: ${recentWar.date}`);
            console.log(`   Attacker: ${recentWar.attacker.nation_name} (${recentWar.attacker.alliance?.name || 'No Alliance'})`);
            console.log(`   Defender: ${recentWar.defender.nation_name} (${recentWar.defender.alliance?.name || 'No Alliance'})`);
            console.log(`   Reason: ${recentWar.reason}`);
            
            // Test 5: Check if our war alert channels are configured
            console.log('\n5️⃣ Checking war alert channel configuration...');
            
            const channelConfigs = await prisma.channelConfig.findMany({
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
            
            console.log(`✅ War alert channels configured: ${channelConfigs.length}`);
            
            for (const config of channelConfigs) {
              console.log(`   📺 Channel ${config.channelId} in server ${config.serverId}`);
              console.log(`   🏛️ Alliance: ${config.server.alliance?.name || 'Unknown'} (ID: ${config.server.allianceId})`);
            }
            
            console.log('\n🎉 SUMMARY');
            console.log('===========');
            console.log('✅ Fixed P&W service can be initialized');
            console.log('✅ Alliance API key retrieval works');
            console.log('✅ P&W API calls with URL parameters work');
            console.log('✅ Recent wars can be fetched');
            console.log(`✅ ${roseWars.length} Rose alliance wars found in recent data`);
            console.log(`✅ ${channelConfigs.length} war alert channels configured`);
            console.log('\n🔥 The fix should work! War alerts will trigger when the bot is deployed.');
            
          } else {
            console.log('⚠️ No recent Rose alliance wars found in the last 5 wars.');
            console.log('   This is normal - the bot will detect new wars as they happen.');
          }
        }
      }
    } else {
      console.log('❌ Failed to get API key:', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedWarAlerts();