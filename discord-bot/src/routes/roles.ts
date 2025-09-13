import express from 'express'
import { z } from 'zod'
import { PermissionFlagsBits, ColorResolvable } from 'discord.js'
import { client } from '../index'
import { getAllianceDiscordServers } from '../utils/roleSync'

const router = express.Router()

const createRoleSchema = z.object({
  allianceId: z.number(),
  roleId: z.string(),
  roleName: z.string(),
  roleDescription: z.string().optional(),
  roleColor: z.string().optional()
})

// Middleware to verify webapp authorization
const verifyWebappAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  const expectedAuth = `Bearer ${process.env.WEBAPP_BOT_SECRET}`
  
  if (!authHeader || authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  next()
}

// Convert hex color to Discord color integer
const hexToDiscordColor = (hex?: string): number | undefined => {
  if (!hex) return undefined
  
  // Remove # if present and convert to number
  const cleanHex = hex.replace('#', '')
  const colorNumber = parseInt(cleanHex, 16)
  
  return isNaN(colorNumber) ? undefined : colorNumber
}

router.post('/create-role', verifyWebappAuth, async (req, res) => {
  try {
    const validatedData = createRoleSchema.parse(req.body)
    
    // Get Discord servers for this alliance
    const discordServers = await getAllianceDiscordServers(validatedData.allianceId)
    
    if (discordServers.length === 0) {
      return res.status(404).json({ 
        error: 'No Discord servers found for alliance',
        allianceId: validatedData.allianceId 
      })
    }

    const results = []
    
    // Create role in each Discord server for this alliance
    for (const serverId of discordServers) {
      try {
        const guild = await client.guilds.fetch(serverId)
        
        if (!guild) {
          console.warn(`Guild not found: ${serverId}`)
          continue
        }

        // Check if bot has manage roles permission
        const botMember = await guild.members.fetch(client.user!.id)
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          console.warn(`Bot lacks ManageRoles permission in guild: ${guild.name}`)
          continue
        }

        // Create the Discord role
        const discordRole = await guild.roles.create({
          name: validatedData.roleName,
          color: hexToDiscordColor(validatedData.roleColor) as ColorResolvable,
          reason: `Alliance role created: ${validatedData.roleName} (Role ID: ${validatedData.roleId})`,
          mentionable: false,
          hoist: false
        })

        console.log(`Created Discord role: ${discordRole.name} (${discordRole.id}) in guild: ${guild.name}`)
        
        results.push({
          serverId: serverId,
          serverName: guild.name,
          discordRoleId: discordRole.id,
          success: true
        })

      } catch (guildError) {
        console.error(`Failed to create role in guild ${serverId}:`, guildError)
        results.push({
          serverId: serverId,
          success: false,
          error: guildError instanceof Error ? guildError.message : 'Unknown error'
        })
      }
    }

    // Return success if at least one role was created
    const successfulCreations = results.filter(r => r.success)
    
    if (successfulCreations.length === 0) {
      return res.status(500).json({
        error: 'Failed to create Discord role in any server',
        results
      })
    }

    // For now, return the first successful creation's role ID
    // In the future, we might want to handle multiple Discord servers differently
    const primaryResult = successfulCreations[0]
    
    res.json({
      success: true,
      discordRoleId: primaryResult.discordRoleId,
      message: `Role created successfully in ${successfulCreations.length} server(s)`,
      results
    })

  } catch (error) {
    console.error('Create role API error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.issues
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Role assignment/removal sync endpoint
const syncRoleSchema = z.object({
  action: z.enum(['assign', 'remove']),
  discordUserId: z.string(),
  discordRoleId: z.string(),
  allianceId: z.number()
})

router.post('/sync-role', verifyWebappAuth, async (req, res) => {
  try {
    const validatedData = syncRoleSchema.parse(req.body)
    
    // Get Discord servers for this alliance
    const discordServers = await getAllianceDiscordServers(validatedData.allianceId)
    
    if (discordServers.length === 0) {
      return res.status(404).json({ 
        error: 'No Discord servers found for alliance',
        allianceId: validatedData.allianceId 
      })
    }

    const results = []
    
    // Sync role in each Discord server for this alliance
    for (const serverId of discordServers) {
      try {
        const guild = await client.guilds.fetch(serverId)
        
        if (!guild) {
          console.warn(`Guild not found: ${serverId}`)
          continue
        }

        // Check if bot has manage roles permission
        const botMember = await guild.members.fetch(client.user!.id)
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          console.warn(`Bot lacks ManageRoles permission in guild: ${guild.name}`)
          continue
        }

        // Get the Discord user
        let member
        try {
          member = await guild.members.fetch(validatedData.discordUserId)
        } catch (memberError) {
          console.warn(`User ${validatedData.discordUserId} not found in guild: ${guild.name}`)
          results.push({
            serverId: serverId,
            serverName: guild.name,
            success: false,
            error: 'User not found in server'
          })
          continue
        }

        // Get the Discord role
        const discordRole = guild.roles.cache.get(validatedData.discordRoleId)
        if (!discordRole) {
          console.warn(`Role ${validatedData.discordRoleId} not found in guild: ${guild.name}`)
          results.push({
            serverId: serverId,
            serverName: guild.name,
            success: false,
            error: 'Role not found in server'
          })
          continue
        }

        // Perform the role assignment/removal
        if (validatedData.action === 'assign') {
          // Check if user already has the role
          if (member.roles.cache.has(validatedData.discordRoleId)) {
            console.log(`User ${member.user.username} already has role ${discordRole.name} in ${guild.name}`)
            results.push({
              serverId: serverId,
              serverName: guild.name,
              success: true,
              message: 'User already has role'
            })
          } else {
            await member.roles.add(discordRole, `Alliance role assigned via webapp`)
            console.log(`Assigned role ${discordRole.name} to ${member.user.username} in ${guild.name}`)
            results.push({
              serverId: serverId,
              serverName: guild.name,
              success: true,
              action: 'assigned'
            })
          }
        } else if (validatedData.action === 'remove') {
          // Check if user has the role
          if (!member.roles.cache.has(validatedData.discordRoleId)) {
            console.log(`User ${member.user.username} doesn't have role ${discordRole.name} in ${guild.name}`)
            results.push({
              serverId: serverId,
              serverName: guild.name,
              success: true,
              message: 'User does not have role'
            })
          } else {
            await member.roles.remove(discordRole, `Alliance role removed via webapp`)
            console.log(`Removed role ${discordRole.name} from ${member.user.username} in ${guild.name}`)
            results.push({
              serverId: serverId,
              serverName: guild.name,
              success: true,
              action: 'removed'
            })
          }
        }

      } catch (guildError) {
        console.error(`Failed to sync role in guild ${serverId}:`, guildError)
        results.push({
          serverId: serverId,
          success: false,
          error: guildError instanceof Error ? guildError.message : 'Unknown error'
        })
      }
    }

    // Return success if at least one sync was successful
    const successfulSyncs = results.filter(r => r.success)
    
    if (successfulSyncs.length === 0) {
      return res.status(500).json({
        error: 'Failed to sync role in any server',
        results
      })
    }

    res.json({
      success: true,
      message: `Role ${validatedData.action} successful in ${successfulSyncs.length} server(s)`,
      results
    })

  } catch (error) {
    console.error('Sync role API error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.issues
      })
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router