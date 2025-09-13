import { Events, GuildMember, Role } from 'discord.js';
import { syncRoleToWebsite } from '../utils/roleSync';

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    try {
      console.log(`[DEBUG] Guild member update detected for ${newMember.user.username} in ${newMember.guild.name}`);
      
      // Get the roles that were added or removed
      const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
      const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

      console.log(`[DEBUG] Roles added: ${addedRoles.size}, Roles removed: ${removedRoles.size}`);

      // Process added roles
      for (const [roleId, role] of addedRoles) {
        console.log(`[DEBUG] Processing added role: ${role.name} (${role.id})`);
        await handleRoleChange(newMember, role, 'assign');
      }

      // Process removed roles
      for (const [roleId, role] of removedRoles) {
        console.log(`[DEBUG] Processing removed role: ${role.name} (${role.id})`);
        await handleRoleChange(newMember, role, 'remove');
      }

      // Log if no role changes detected
      if (addedRoles.size === 0 && removedRoles.size === 0) {
        console.log(`[DEBUG] No role changes detected for ${newMember.user.username}`);
      }
    } catch (error) {
      console.error('Error handling guild member role update:', error);
    }
  }
};

async function handleRoleChange(member: GuildMember, role: Role, action: 'assign' | 'remove') {
  try {
    console.log(`[ROLE SYNC] ${action}: ${member.user.username} ${action === 'assign' ? 'gained' : 'lost'} role ${role.name} (${role.id})`);
    
    // Skip bot roles and @everyone
    if (role.managed || role.name === '@everyone') {
      console.log(`[ROLE SYNC] Skipping managed role or @everyone: ${role.name}`);
      return;
    }

    console.log(`[ROLE SYNC] Syncing ${action} of role ${role.name} for ${member.user.username} to website...`);

    // Sync the role change to the website
    const result = await syncRoleToWebsite({
      discordServerId: member.guild.id,
      discordUserId: member.user.id,
      discordUsername: member.user.username,
      discordRoleId: role.id,
      action: action
    });

    if (result.success) {
      console.log(`[ROLE SYNC] ✅ Successfully synced ${action} of role ${role.name} for ${member.user.username} to website`);
      if (result.identifiedBy) {
        console.log(`[ROLE SYNC] User identified by: ${result.identifiedBy}`);
      }
      if (result.isPlaceholderUser) {
        console.log(`[ROLE SYNC] Created placeholder user for Discord user ${member.user.username}`);
      }
    } else {
      console.warn(`[ROLE SYNC] ❌ Failed to sync ${action} of role ${role.name} for ${member.user.username}:`, result.error);
      if (result.suggestions) {
        console.warn(`[ROLE SYNC] Suggestions:`, result.suggestions);
      }
    }
  } catch (error) {
    console.error(`[ROLE SYNC] Error syncing role ${action} for ${member.user.username}:`, error);
  }
}