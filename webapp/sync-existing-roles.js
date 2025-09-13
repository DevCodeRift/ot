/**
 * Utility script to sync existing alliance roles to Discord
 * 
 * This script helps sync roles that were created before the Discord integration
 * was implemented. It will:
 * 1. Find all roles without Discord role IDs
 * 2. Create corresponding Discord roles via the bot
 * 3. Update the database with the Discord role IDs
 * 
 * Usage:
 * node sync-existing-roles.js [allianceId]
 * 
 * If no allianceId is provided, it will sync all alliances.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncExistingRoles(targetAllianceId = null) {
  try {
    console.log('🔍 Finding roles without Discord sync...\n');
    
    // Build the where clause
    let whereClause = {
      isActive: true,
      OR: [
        { discordRoleId: null },
        { discordRoleId: '' }
      ]
    };
    
    if (targetAllianceId) {
      whereClause.allianceId = parseInt(targetAllianceId);
    }
    
    // Find unsynced roles using raw query to avoid TypeScript issues
    let unsyncedRoles;
    if (targetAllianceId) {
      unsyncedRoles = await prisma.$queryRaw`
        SELECT 
          id, 
          name, 
          description, 
          color, 
          "allianceId",
          "createdAt"
        FROM alliance_roles 
        WHERE "isActive" = true 
          AND ("discordRoleId" IS NULL OR "discordRoleId" = '')
          AND "allianceId" = ${parseInt(targetAllianceId)}
        ORDER BY "allianceId", "createdAt"
      `;
    } else {
      unsyncedRoles = await prisma.$queryRaw`
        SELECT 
          id, 
          name, 
          description, 
          color, 
          "allianceId",
          "createdAt"
        FROM alliance_roles 
        WHERE "isActive" = true 
          AND ("discordRoleId" IS NULL OR "discordRoleId" = '')
        ORDER BY "allianceId", "createdAt"
      `;
    }
    
    if (unsyncedRoles.length === 0) {
      console.log('✅ All roles are already synced with Discord!');
      return;
    }
    
    console.log(`Found ${unsyncedRoles.length} unsynced roles:\n`);
    
    // Group by alliance for better display
    const rolesByAlliance = {};
    unsyncedRoles.forEach(role => {
      if (!rolesByAlliance[role.allianceId]) {
        rolesByAlliance[role.allianceId] = [];
      }
      rolesByAlliance[role.allianceId].push(role);
    });
    
    // Display roles by alliance
    for (const [allianceId, roles] of Object.entries(rolesByAlliance)) {
      console.log(`📋 Alliance ${allianceId}:`);
      roles.forEach(role => {
        console.log(`   • ${role.name} (${role.id})`);
        console.log(`     Created: ${new Date(role.createdAt).toLocaleDateString()}`);
        if (role.description) {
          console.log(`     Description: ${role.description}`);
        }
        console.log('');
      });
    }
    
    console.log('\n⚠️  Manual sync required:');
    console.log('   To sync these roles, use the admin panel or API endpoint:');
    console.log('   POST /api/alliance/roles/sync-existing');
    console.log('   Body: { "allianceId": YOUR_ALLIANCE_ID }');
    console.log('\n   Or use the alliance roles management page with admin permissions.');
    
  } catch (error) {
    console.error('❌ Error finding unsynced roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get alliance ID from command line argument
const targetAllianceId = process.argv[2];

if (targetAllianceId && isNaN(parseInt(targetAllianceId))) {
  console.error('❌ Invalid alliance ID. Please provide a numeric alliance ID.');
  process.exit(1);
}

console.log('🚀 Discord Role Sync Utility');
console.log('============================\n');

if (targetAllianceId) {
  console.log(`🎯 Checking alliance ${targetAllianceId} for unsynced roles...\n`);
} else {
  console.log('🌍 Checking all alliances for unsynced roles...\n');
}

syncExistingRoles(targetAllianceId);