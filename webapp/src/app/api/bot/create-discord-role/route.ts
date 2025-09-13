import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createDiscordRoleSchema = z.object({
  allianceId: z.number(),
  roleId: z.string(),
  roleName: z.string(),
  roleDescription: z.string().optional(),
  roleColor: z.string().optional()
})

// Environment variable for bot communication
const WEBAPP_BOT_SECRET = process.env.WEBAPP_BOT_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${WEBAPP_BOT_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createDiscordRoleSchema.parse(body)

    // Get Discord bot URL from environment (Railway production or local development)
    const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || process.env.DISCORD_BOT_URL || 'http://localhost:8080'
    
    // Call Discord bot to create role
    try {
      const discordResponse = await fetch(`${DISCORD_BOT_URL}/api/create-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEBAPP_BOT_SECRET}`
        },
        body: JSON.stringify({
          allianceId: validatedData.allianceId,
          roleId: validatedData.roleId,
          roleName: validatedData.roleName,
          roleDescription: validatedData.roleDescription,
          roleColor: validatedData.roleColor
        })
      })

      if (!discordResponse.ok) {
        const errorText = await discordResponse.text()
        console.error('Discord bot role creation failed:', errorText)
        return NextResponse.json(
          { error: 'Failed to create Discord role', details: errorText },
          { status: 500 }
        )
      }

      const discordResult = await discordResponse.json()
      
      return NextResponse.json({
        success: true,
        discordRoleId: discordResult.discordRoleId,
        message: 'Discord role created successfully'
      })
      
    } catch (fetchError) {
      console.error('Discord bot connection failed:', fetchError)
      
      // Check if it's a connection error
      if (fetchError instanceof Error && (
          fetchError.message.includes('ECONNREFUSED') || 
          fetchError.message.includes('fetch failed') ||
          (fetchError as any).cause?.code === 'ECONNREFUSED'
        )) {
        return NextResponse.json({
          error: 'Discord bot is not running',
          details: `Cannot connect to Discord bot at ${DISCORD_BOT_URL}. Please ensure the Discord bot is running.`,
          botUrl: DISCORD_BOT_URL
        }, { status: 503 })
      }
      
      // Other fetch errors
      return NextResponse.json({
        error: 'Failed to communicate with Discord bot',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Create Discord role API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}