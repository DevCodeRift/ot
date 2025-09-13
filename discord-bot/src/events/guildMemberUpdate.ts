import { Events, GuildMember, Role } from 'discord.js';
import { syncRoleToWebsite } from '../utils/roleSync';

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    try {
      // Force logging to appear in Railway
      console.log(`========================================`);
      console.log(`[ROLE EVENT] Guild member update detected!`);
      console.log(`[ROLE EVENT] User: ${newMember.user.username}`);
      console.log(`[ROLE EVENT] Guild: ${newMember.guild.name}`);
      console.log(`[ROLE EVENT] Time: ${new Date().toISOString()}`);
      
      // Get the roles that were added or removed
      const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
      const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

      console.log(`[ROLE EVENT] Roles added: ${addedRoles.size}, Roles removed: ${removedRoles.size}`);

      // Process added roles
      for (const [roleId, role] of addedRoles) {
        console.log(`[ROLE EVENT] Processing ADDED role: ${role.name} (${role.id})`);
        await handleRoleChange(newMember, role, 'assign');
      }

      // Process removed roles
      for (const [roleId, role] of removedRoles) {
        console.log(`[ROLE EVENT] Processing REMOVED role: ${role.name} (${role.id})`);
        await handleRoleChange(newMember, role, 'remove');
      }

      // Log if no role changes detected
      if (addedRoles.size === 0 && removedRoles.size === 0) {
        console.log(`[ROLE EVENT] No role changes detected for ${newMember.user.username}`);
      }
      
      console.log(`========================================`);
    } catch (error) {
      console.error('[ROLE EVENT] Error handling guild member role update:', error);
    }
  }
};

async function handleRoleChange(member: GuildMember, role: Role, action: 'assign' | 'remove') {
  try {
    console.log(`[ROLE SYNC] ========================================`);
    console.log(`[ROLE SYNC] ${action.toUpperCase()}: ${member.user.username} ${action === 'assign' ? 'gained' : 'lost'} role ${role.name} (${role.id})`);
    
    // Skip bot roles and @everyone
    if (role.managed || role.name === '@everyone') {
      console.log(`[ROLE SYNC] SKIPPED: Role is managed or @everyone: ${role.name}`);
      console.log(`[ROLE SYNC] ========================================`);
      return;
    }

    console.log(`[ROLE SYNC] CALLING WEBAPP: Syncing ${action} of role ${role.name} for ${member.user.username}`);

    // Sync the role change to the website
    const result = await syncRoleToWebsite({
      discordServerId: member.guild.id,
      discordUserId: member.user.id,
      discordUsername: member.user.username,
      discordRoleId: role.id,
      action: action
    });

    if (result.success) {
      console.log(`[ROLE SYNC] ✅ SUCCESS: Synced ${action} of role ${role.name} for ${member.user.username}`);
      if (result.identifiedBy) {
        console.log(`[ROLE SYNC] User identified by: ${result.identifiedBy}`);
      }
      if (result.isPlaceholderUser) {
        console.log(`[ROLE SYNC] Created placeholder user for: ${member.user.username}`);
      }
    } else {
      console.warn(`[ROLE SYNC] ❌ FAILED: Could not sync ${action} of role ${role.name}:`, result.error);
      if (result.suggestions) {
        console.warn(`[ROLE SYNC] Suggestions:`, result.suggestions);
      }
    }
    console.log(`[ROLE SYNC] ========================================`);
  } catch (error) {
    console.error(`[ROLE SYNC] EXCEPTION: Error during ${action} for ${member.user.username}:`, error);
    console.log(`[ROLE SYNC] ========================================`);
  }
}