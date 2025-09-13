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

    // Forward the request to the Discord bot
    // In production, this would be sent to the bot's webhook endpoint
    // For now, we'll return success and log the action
    console.log(`Discord sync request: ${validatedData.action} role ${validatedData.discordRoleId} for user ${validatedData.discordUserId} in alliance ${validatedData.allianceId}`)

    // TODO: Implement actual Discord bot communication
    // This could be done via:
    // 1. HTTP webhook to the bot
    // 2. Message queue (Redis, RabbitMQ)
    // 3. Database-based queue the bot polls
    
    return NextResponse.json({
      success: true,
      message: 'Discord sync request queued',
      request: validatedData
    })

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