import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for Discord sync request from website to bot
const discordSyncSchema = z.object({
  action: z.enum(['assign', 'remove']),
  discordUserId: z.string(),
  discordRoleId: z.string(),
  allianceId: z.number()
})

// POST /api/bot/discord-sync - Send role sync request to Discord bot
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    if (token !== process.env.WEBAPP_BOT_SECRET) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = discordSyncSchema.parse(body)

    // Get Discord bot URL from environment
    const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || process.env.DISCORD_BOT_URL || 'https://ot-production.up.railway.app'
    
    // Forward the request to the Discord bot
    try {
      const botResponse = await fetch(`${DISCORD_BOT_URL}/api/sync-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
        },
        body: JSON.stringify({
          action: validatedData.action,
          discordUserId: validatedData.discordUserId,
          discordRoleId: validatedData.discordRoleId,
          allianceId: validatedData.allianceId
        })
      })

      if (!botResponse.ok) {
        const errorText = await botResponse.text()
        console.error('Discord bot role sync failed:', errorText)
        return NextResponse.json(
          { error: 'Discord role sync failed', details: errorText },
          { status: 502 }
        )
      }

      const botResult = await botResponse.json()
      console.log(`Discord sync successful: ${validatedData.action} role ${validatedData.discordRoleId} for user ${validatedData.discordUserId}`)
      
      return NextResponse.json({
        success: true,
        message: 'Discord role sync completed',
        result: botResult
      })

    } catch (fetchError) {
      console.error('Failed to communicate with Discord bot:', fetchError)
      return NextResponse.json(
        { error: 'Failed to communicate with Discord bot', details: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        { status: 502 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Discord sync error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}