const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBotServers() {
  try {
    console.log('🤖 Checking Discord bot server connections...\n');
    
    // First, let's test the bot connection
    const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || process.env.DISCORD_BOT_URL || 'https://ot-production.up.railway.app';
    const WEBAPP_BOT_SECRET = process.env.WEBAPP_BOT_SECRET;
    
    console.log('📡 Testing bot connection at:', DISCORD_BOT_URL);
    
    try {
      const response = await fetch(`${DISCORD_BOT_URL}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEBAPP_BOT_SECRET}`
        },
        body: JSON.stringify({
          serverId: 'test',
          message: 'Testing connection from webapp'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bot connection successful!');
        console.log('📊 Bot Status:', data.botStatus);
        console.log('🏠 Connected to', data.serverCount, 'Discord servers:');
        
        if (data.servers && data.servers.length > 0) {
          data.servers.forEach((server, index) => {
            console.log(`  ${index + 1}. ${server.name} (ID: ${server.id})`);
            console.log(`     Members: ${server.memberCount}`);
            console.log(`     Joined: ${server.joinedAt}`);
            console.log('');
          });
          
          console.log('💡 To use any of these servers for role sync:');
          console.log('   1. Copy one of the server IDs from above');
          console.log('   2. Edit setup-discord-server.js');
          console.log('   3. Replace "YOUR_DISCORD_SERVER_ID_HERE" with the server ID');
          console.log('   4. Run: node setup-discord-server.js');
        } else {
          console.log('⚠️  No Discord servers found. Make sure:');
          console.log('   1. The bot is invited to your Discord server');
          console.log('   2. The bot has proper permissions');
          console.log('   3. The bot is online and connected');
        }
      } else {
        console.log('❌ Bot connection failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error details:', errorText);
      }
    } catch (fetchError) {
      console.log('❌ Failed to connect to Discord bot:', fetchError.message);
      console.log('   Make sure the bot is running and accessible at:', DISCORD_BOT_URL);
    }
    
    // Check database configuration
    console.log('\n📊 Checking database Discord server configuration...');
    const configuredServers = await prisma.discordServer.findMany({
      include: {
        alliance: {
          select: { name: true }
        }
      }
    });
    
    if (configuredServers.length > 0) {
      console.log('✅ Found', configuredServers.length, 'configured Discord servers:');
      configuredServers.forEach((server, index) => {
        console.log(`  ${index + 1}. ${server.name || 'Unnamed Server'} (ID: ${server.id})`);
        console.log(`     Alliance: ${server.alliance?.name || 'None'} (ID: ${server.allianceId})`);
        console.log(`     Active: ${server.isActive}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No Discord servers configured in database.');
      console.log('   Run setup-discord-server.js to configure your server.');
    }
    
  } catch (error) {
    console.error('❌ Error checking bot servers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkBotServers();
}

module.exports = { checkBotServers };