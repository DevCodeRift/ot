import { Events, GuildMember, Role } from 'discord.js';
import { syncRoleToWebsite } from '../utils/roleSync';

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    try {
      // Get the roles that were added or removed
      const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
      const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

      // Process added roles
      for (const [roleId, role] of addedRoles) {
        await handleRoleChange(newMember, role, 'assign');
      }

      // Process removed roles
      for (const [roleId, role] of removedRoles) {
        await handleRoleChange(newMember, role, 'remove');
      }
    } catch (error) {
      console.error('Error handling guild member role update:', error);
    }
  }
};

async function handleRoleChange(member: GuildMember, role: Role, action: 'assign' | 'remove') {
  try {
    // Skip bot roles and @everyone
    if (role.managed || role.name === '@everyone') {
      return;
    }

    console.log(`Role ${action}: ${member.user.username} ${action === 'assign' ? 'gained' : 'lost'} role ${role.name}`);

    // Sync the role change to the website
    const result = await syncRoleToWebsite({
      discordServerId: member.guild.id,
      discordUserId: member.user.id,
      discordUsername: member.user.username,
      discordRoleId: role.id,
      action: action
    });

    if (result.success) {
      console.log(`Successfully synced ${action} of role ${role.name} for ${member.user.username} to website`);
      if (result.identifiedBy) {
        console.log(`User identified by: ${result.identifiedBy}`);
      }
      if (result.isPlaceholderUser) {
        console.log(`Created placeholder user for Discord user ${member.user.username}`);
      }
    } else {
      console.warn(`Failed to sync ${action} of role ${role.name} for ${member.user.username}:`, result.error);
    }
  } catch (error) {
    console.error(`Error syncing role ${action} for ${member.user.username}:`, error);
  }
}