const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectRoleSync() {
  try {
    console.log('🧪 Testing direct role sync (bypassing auth)...\n');
    
    // Get a role from the database
    const roles = await prisma.allianceRole.findMany({
      where: { 
        allianceId: 790,
        isActive: true
      },
      take: 1
    });
    
    if (roles.length === 0) {
      console.log('⚠️  No active roles found for alliance 790');
      return;
    }
    
    const testRole = roles[0];
    console.log('🎯 Testing sync for role:', testRole.name, '(ID:', testRole.id + ')');
    
    // Test the Discord bot directly
    const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || 'https://ot-production.up.railway.app';
    const WEBAPP_BOT_SECRET = process.env.WEBAPP_BOT_SECRET;
    
    console.log('📡 Calling Discord bot at:', DISCORD_BOT_URL);
    
    const response = await fetch(`${DISCORD_BOT_URL}/api/create-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBAPP_BOT_SECRET}`
      },
      body: JSON.stringify({
        allianceId: testRole.allianceId,
        roleId: testRole.id,
        roleName: testRole.name,
        roleDescription: testRole.description,
        roleColor: testRole.color
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Discord role creation successful!');
      console.log('📊 Result:', JSON.stringify(result, null, 2));
      
      // Update the role with Discord ID if successful
      if (result.results && result.results.length > 0) {
        const discordRoleId = result.results[0].discordRoleId;
        if (discordRoleId) {
          await prisma.allianceRole.update({
            where: { id: testRole.id },
            data: { discordRoleId: discordRoleId }
          });
          console.log('📝 Updated role with Discord ID:', discordRoleId);
        }
      }
    } else {
      console.log('❌ Discord role creation failed:', response.status);
      console.log('📋 Error details:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testDirectRoleSync();
}

module.exports = { testDirectRoleSync };