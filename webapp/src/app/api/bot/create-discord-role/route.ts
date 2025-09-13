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

    // Get Discord bot URL from environment
    const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3001'
    
    // Call Discord bot to create role
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