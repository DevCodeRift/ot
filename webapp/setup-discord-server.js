const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDiscordServer() {
  const allianceId = 790; // Your alliance ID
  
  // You need to replace this with your actual Discord server ID
  // To get your Discord server ID:
  // 1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
  // 2. Right-click on your server name and select "Copy Server ID"
  const discordServerId = "1407812256636469470"; // CodeRift server ID
  
  try {
    // Check if server already exists
    const existingServer = await prisma.discordServer.findUnique({
      where: { id: discordServerId }
    });
    
    if (existingServer) {
      console.log('Discord server already exists:', existingServer);
      
      // Update the alliance ID if needed
      if (existingServer.allianceId !== allianceId) {
        const updated = await prisma.discordServer.update({
          where: { id: discordServerId },
          data: { allianceId: allianceId }
        });
        console.log('Updated server alliance ID:', updated);
      }
    } else {
      // Create new Discord server entry
      const newServer = await prisma.discordServer.create({
        data: {
          id: discordServerId,
          name: "CodeRift", // Your Discord server name
          allianceId: allianceId,
          isActive: true,
          settings: {},
          enabledModules: ["roles", "member-management"] // Enable modules as needed
        }
      });
      
      console.log('Created new Discord server entry:', newServer);
    }
    
    // Verify the setup
    const servers = await prisma.discordServer.findMany({
      where: { allianceId: allianceId }
    });
    
    console.log('\n✅ Discord servers configured for alliance', allianceId + ':', servers);
    
  } catch (error) {
    console.error('❌ Error setting up Discord server:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  console.log('🔧 Setting up Discord server for alliance 790...\n');
  console.log('⚠️  IMPORTANT: You need to edit this script and replace "YOUR_DISCORD_SERVER_ID_HERE" with your actual Discord server ID!\n');
  console.log('📋 To get your Discord server ID:');
  console.log('   1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)');
  console.log('   2. Right-click on your server name and select "Copy Server ID"');
  console.log('   3. Replace "YOUR_DISCORD_SERVER_ID_HERE" in this script with the copied ID\n');
  
  setupDiscordServer();
}

module.exports = { setupDiscordServer };