import express from 'express'
import { client } from '../index'

const router = express.Router()

// Test endpoint to manually trigger role sync
router.post('/test-role-sync', async (req: express.Request, res: express.Response) => {
  try {
    const { guildId, userId, roleId, action } = req.body

    if (!guildId || !userId || !roleId || !action) {
      return res.status(400).json({ 
        error: 'Missing required fields: guildId, userId, roleId, action' 
      })
    }

    console.log(`[TEST] Manual role sync test: ${action} role ${roleId} for user ${userId} in guild ${guildId}`)

    // Import the sync function
    const { syncRoleToWebsite } = await import('../utils/roleSync')

    // Get guild and user info for better logging
    const guild = client.guilds.cache.get(guildId)
    const member = guild ? await guild.members.fetch(userId).catch(() => null) : null
    const role = guild ? guild.roles.cache.get(roleId) : null

    console.log(`[TEST] Guild: ${guild?.name || 'Not found'}`)
    console.log(`[TEST] Member: ${member?.user.username || 'Not found'}`) 
    console.log(`[TEST] Role: ${role?.name || 'Not found'}`)

    // Trigger the sync function
    const result = await syncRoleToWebsite({
      discordServerId: guildId,
      discordUserId: userId,
      discordUsername: member?.user.username,
      discordRoleId: roleId,
      action: action as 'assign' | 'remove'
    })

    console.log(`[TEST] Sync result:`, result)

    res.json({
      success: true,
      message: 'Manual role sync test completed',
      guildInfo: {
        name: guild?.name,
        found: !!guild
      },
      memberInfo: {
        username: member?.user.username,
        found: !!member
      },
      roleInfo: {
        name: role?.name,
        found: !!role
      },
      syncResult: result
    })

  } catch (error) {
    console.error('[TEST] Error in manual role sync test:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
})

// Test endpoint to check bot status and connections
router.get('/bot-status', (req: express.Request, res: express.Response) => {
  try {
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      botPermissions: guild.members.me?.permissions.toArray() || []
    }))

    res.json({
      botReady: client.isReady(),
      botTag: client.user?.tag,
      guildsCount: client.guilds.cache.size,
      guilds: guilds,
      targetGuildConnected: guilds.some(g => g.id === '1407812256636469470'),
      uptime: process.uptime()
    })
  } catch (error) {
    console.error('[TEST] Error getting bot status:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
})

export default router