const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoleAssignmentSync() {
  try {
    console.log('🔍 Testing Role Assignment Synchronization...\n');
    
    // First, let's find a user and role to test with
    console.log('📋 Finding test data...');
    
    const users = await prisma.user.findMany({
      where: { 
        currentAllianceId: 790,
        discordId: { not: null }
      },
      select: {
        id: true,
        name: true,
        discordId: true,
        discordUsername: true
      },
      take: 1
    });
    
    const roles = await prisma.allianceRole.findMany({
      where: { 
        allianceId: 790,
        isActive: true,
        discordRoleId: { not: null }
      },
      select: {
        id: true,
        name: true,
        discordRoleId: true
      },
      take: 1
    });
    
    if (users.length === 0) {
      console.log('❌ No users found with Discord ID in alliance 790');
      console.log('💡 You need users with Discord accounts linked to test role assignment sync');
      return;
    }
    
    if (roles.length === 0) {
      console.log('❌ No roles found with Discord role ID in alliance 790');
      console.log('💡 Make sure you have synced roles to Discord first using the individual role sync');
      return;
    }
    
    const testUser = users[0];
    const testRole = roles[0];
    
    console.log('✅ Test data found:');
    console.log(`   User: ${testUser.name} (Discord: ${testUser.discordUsername})`);
    console.log(`   Role: ${testRole.name} (Discord ID: ${testRole.discordRoleId})`);
    console.log('');
    
    // Test 1: Webapp → Discord assignment
    console.log('🧪 Test 1: Webapp → Discord role assignment');
    
    try {
      const assignResponse = await fetch('http://localhost:3000/api/alliance/roles/assign?allianceId=790', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: testUser.id,
          roleId: testRole.id
        })
      });
      
      if (assignResponse.ok) {
        const assignResult = await assignResponse.json();
        console.log('✅ Webapp role assignment successful');
        console.log('📊 Assignment details:', JSON.stringify(assignResult, null, 2));
      } else {
        const assignError = await assignResponse.json();
        console.log('❌ Webapp role assignment failed:', assignResponse.status);
        console.log('📋 Error details:', JSON.stringify(assignError, null, 2));
      }
    } catch (assignError) {
      console.log('❌ Webapp role assignment failed with exception:', assignError.message);
    }
    
    console.log('');
    
    // Test 2: Check current role assignments
    console.log('🔍 Checking current role assignments in database...');
    
    const currentAssignments = await prisma.userAllianceRole.findMany({
      where: {
        userId: testUser.id,
        roleId: testRole.id,
        allianceId: 790,
        isActive: true
      },
      include: {
        user: { select: { name: true, discordUsername: true } },
        role: { select: { name: true, discordRoleId: true } }
      }
    });
    
    console.log(`📊 Found ${currentAssignments.length} active role assignments for this user/role combination`);
    currentAssignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.user.name} → ${assignment.role.name}`);
      console.log(`      Assigned by: ${assignment.assignedBy}`);
      console.log(`      Assigned at: ${assignment.assignedAt}`);
    });
    
    console.log('');
    
    // Test 3: Test Discord bot sync endpoint directly
    console.log('🧪 Test 3: Testing Discord bot sync endpoint directly');
    
    try {
      const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || 'https://ot-production.up.railway.app';
      const WEBAPP_BOT_SECRET = process.env.WEBAPP_BOT_SECRET;
      
      const botSyncResponse = await fetch(`${DISCORD_BOT_URL}/api/sync-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEBAPP_BOT_SECRET}`
        },
        body: JSON.stringify({
          action: 'assign',
          discordUserId: testUser.discordId,
          discordRoleId: testRole.discordRoleId,
          allianceId: 790
        })
      });
      
      if (botSyncResponse.ok) {
        const botSyncResult = await botSyncResponse.json();
        console.log('✅ Discord bot sync successful');
        console.log('📊 Bot sync result:', JSON.stringify(botSyncResult, null, 2));
      } else {
        const botSyncError = await botSyncResponse.text();
        console.log('❌ Discord bot sync failed:', botSyncResponse.status);
        console.log('📋 Error details:', botSyncError);
      }
    } catch (botError) {
      console.log('❌ Discord bot sync failed with exception:', botError.message);
    }
    
    console.log('');
    
    // Test 4: Test webapp Discord sync endpoint
    console.log('🧪 Test 4: Testing webapp Discord sync endpoint');
    
    try {
      const webappSyncResponse = await fetch('http://localhost:3000/api/bot/discord-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
        },
        body: JSON.stringify({
          action: 'assign',
          discordUserId: testUser.discordId,
          discordRoleId: testRole.discordRoleId,
          allianceId: 790
        })
      });
      
      if (webappSyncResponse.ok) {
        const webappSyncResult = await webappSyncResponse.json();
        console.log('✅ Webapp Discord sync successful');
        console.log('📊 Webapp sync result:', JSON.stringify(webappSyncResult, null, 2));
      } else {
        const webappSyncError = await webappSyncResponse.json();
        console.log('❌ Webapp Discord sync failed:', webappSyncResponse.status);
        console.log('📋 Error details:', JSON.stringify(webappSyncError, null, 2));
      }
    } catch (webappSyncError) {
      console.log('❌ Webapp Discord sync failed with exception:', webappSyncError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testRoleAssignmentSync();
}

module.exports = { testRoleAssignmentSync };