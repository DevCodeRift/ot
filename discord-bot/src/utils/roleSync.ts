import { Guild, Role, GuildMember, ColorResolvable } from 'discord.js'
import { prisma } from '../lib/prisma'

export interface AllianceRoleData {
  id: string
  name: string
  description?: string
  color?: string
  allianceId: number
}

export interface RoleAssignmentData {
  userId: string
  roleId: string
  allianceId: number
  action: 'assign' | 'remove'
}

/**
 * Creates a Discord role based on alliance role data
 */
export async function createDiscordRole(guild: Guild, roleData: AllianceRoleData): Promise<Role | null> {
  try {
    // Convert hex color to Discord color format
    let color: ColorResolvable = 'Default'
    if (roleData.color) {
      // Remove # if present and convert to number
      const hexColor = roleData.color.replace('#', '')
      color = parseInt(hexColor, 16) as ColorResolvable
    }

    const discordRole = await guild.roles.create({
      name: `[Alliance] ${roleData.name}`,
      color: color,
      reason: `Auto-created for alliance ${roleData.allianceId} role: ${roleData.name}`,
      mentionable: false,
      hoist: false
    })

    console.log(`Created Discord role: ${discordRole.name} (ID: ${discordRole.id}) for alliance ${roleData.allianceId}`)
    
    // Store the Discord role ID in the database
    await prisma.allianceRole.update({
      where: { id: roleData.id },
      data: { discordRoleId: discordRole.id }
    })

    return discordRole
  } catch (error) {
    console.error('Error creating Discord role:', error)
    return null
  }
}

/**
 * Finds a user in Discord by various identifiers
 */
export async function findDiscordUser(
  guild: Guild, 
  identifier: string, 
  type: 'discord_id' | 'nation_name' | 'nation_id'
): Promise<GuildMember | null> {
  try {
    if (type === 'discord_id') {
      // Direct Discord ID lookup
      try {
        return await guild.members.fetch(identifier)
      } catch {
        return null
      }
    }

    // For nation name/ID, we need to look up the user in our database first
    let user
    if (type === 'nation_id') {
      user = await prisma.user.findFirst({
        where: { pwNationId: parseInt(identifier) }
      })
    } else if (type === 'nation_name') {
      user = await prisma.user.findFirst({
        where: { pwNationName: { equals: identifier, mode: 'insensitive' } }
      })
    }

    if (!user?.discordId) {
      return null
    }

    // Fetch Discord member by stored Discord ID
    try {
      return await guild.members.fetch(user.discordId)
    } catch {
      return null
    }
  } catch (error) {
    console.error('Error finding Discord user:', error)
    return null
  }
}

/**
 * Assigns or removes a Discord role from a user
 */
export async function syncDiscordRoleAssignment(
  guild: Guild,
  assignment: RoleAssignmentData,
  identifier: string,
  identifierType: 'discord_id' | 'nation_name' | 'nation_id'
): Promise<boolean> {
  try {
    // Find the alliance role to get Discord role ID
    const allianceRole = await prisma.allianceRole.findFirst({
      where: {
        id: assignment.roleId,
        allianceId: assignment.allianceId
      }
    })

    if (!allianceRole?.discordRoleId) {
      console.log('Alliance role not found or no Discord role ID stored')
      return false
    }

    // Find Discord role
    const discordRole = guild.roles.cache.get(allianceRole.discordRoleId)
    if (!discordRole) {
      console.log('Discord role not found in guild')
      return false
    }

    // Find Discord user
    const discordMember = await findDiscordUser(guild, identifier, identifierType)
    if (!discordMember) {
      console.log('Discord member not found')
      return false
    }

    // Assign or remove role
    if (assignment.action === 'assign') {
      await discordMember.roles.add(discordRole, 'Role assigned via website')
      console.log(`Assigned Discord role ${discordRole.name} to ${discordMember.displayName}`)
    } else {
      await discordMember.roles.remove(discordRole, 'Role removed via website')
      console.log(`Removed Discord role ${discordRole.name} from ${discordMember.displayName}`)
    }

    return true
  } catch (error) {
    console.error('Error syncing Discord role assignment:', error)
    return false
  }
}

/**
 * Syncs role assignments from Discord to website
 */
export async function syncWebsiteRoleAssignment(
  guildId: string,
  discordUserId: string,
  discordRoleId: string,
  action: 'assign' | 'remove'
): Promise<boolean> {
  try {
    // Find the alliance role by Discord role ID
    const allianceRole = await prisma.allianceRole.findFirst({
      where: { discordRoleId: discordRoleId }
    })

    if (!allianceRole) {
      console.log('Alliance role not found for Discord role ID:', discordRoleId)
      return false
    }

    // Find user by Discord ID
    const user = await prisma.user.findFirst({
      where: { discordId: discordUserId }
    })

    if (!user) {
      console.log('User not found for Discord ID:', discordUserId)
      return false
    }

    if (action === 'assign') {
      // Check if assignment already exists
      const existing = await prisma.userAllianceRole.findFirst({
        where: {
          userId: user.id,
          roleId: allianceRole.id,
          allianceId: allianceRole.allianceId,
          isActive: true
        }
      })

      if (!existing) {
        // Create role assignment
        await prisma.userAllianceRole.create({
          data: {
            userId: user.id,
            roleId: allianceRole.id,
            allianceId: allianceRole.allianceId,
            assignedBy: 'DISCORD_SYNC',
            assignedAt: new Date(),
            isActive: true
          }
        })
        console.log(`Synced role assignment from Discord: ${user.discordUsername} -> ${allianceRole.name}`)
      }
    } else {
      // Remove role assignment
      await prisma.userAllianceRole.updateMany({
        where: {
          userId: user.id,
          roleId: allianceRole.id,
          allianceId: allianceRole.allianceId,
          isActive: true
        },
        data: { isActive: false }
      })
      console.log(`Synced role removal from Discord: ${user.discordUsername} -> ${allianceRole.name}`)
    }

    return true
  } catch (error) {
    console.error('Error syncing website role assignment:', error)
    return false
  }
}

/**
 * Gets all Discord servers where bot should sync roles for an alliance
 */
export async function getAllianceDiscordServers(allianceId: number): Promise<string[]> {
  try {
    // Get all Discord servers configured for this alliance
    const servers = await prisma.discordServer.findMany({
      where: {
        allianceId: allianceId,
        isActive: true
      },
      select: { id: true }
    })

    return servers.map(server => server.id)
  } catch (error) {
    console.error('Error getting alliance Discord servers:', error)
    return []
  }
}

/**
 * Cleanup Discord role when alliance role is deleted
 */
export async function deleteDiscordRole(guild: Guild, discordRoleId: string): Promise<boolean> {
  try {
    const discordRole = guild.roles.cache.get(discordRoleId)
    if (discordRole) {
      await discordRole.delete('Alliance role deleted')
      console.log(`Deleted Discord role: ${discordRole.name}`)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting Discord role:', error)
    return false
  }
}

/**
 * Sync role assignment from Discord to website
 */
export async function syncRoleToWebsite(params: {
  discordServerId: string
  discordUserId: string
  discordUsername?: string
  discordRoleId: string
  action: 'assign' | 'remove'
  nationName?: string
  nationId?: number
}): Promise<any> {
  try {
    const webappUrl = process.env.WEBAPP_API_URL || 'http://localhost:3000'
    const botSecret = process.env.WEBAPP_BOT_SECRET
    
    if (!botSecret) {
      throw new Error('WEBAPP_BOT_SECRET not configured')
    }

    const requestBody = {
      discordServerId: params.discordServerId,
      discordUserId: params.discordUserId,
      discordRoleId: params.discordRoleId,
      action: params.action,
      botSecret: botSecret,
      discordUsername: params.discordUsername,
      nationName: params.nationName,
      nationId: params.nationId
    }

    const response = await fetch(`${webappUrl}/api/bot/sync-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
        suggestions: result.suggestions
      }
    }

    return {
      success: true,
      message: result.message,
      identifiedBy: result.identifiedBy,
      isPlaceholderUser: result.isPlaceholderUser
    }
  } catch (error) {
    console.error('Error syncing role to website:', error)
    return {
      success: false,
      error: error.message
    }
  }
}