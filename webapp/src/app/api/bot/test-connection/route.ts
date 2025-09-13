import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Test connection between webapp and Discord bot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serverId, message } = body

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 })
    }

    // Discord bot API URL (will be Railway deployed bot)
    const botApiUrl = process.env.DISCORD_BOT_API_URL || 'http://localhost:3001'
    
    try {
      // Make request to Discord bot
      const botResponse = await fetch(`${botApiUrl}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET || 'dev-secret'}`
        },
        body: JSON.stringify({
          serverId,
          message: message || 'Test connection from webapp',
          userId: session.user.id,
          timestamp: new Date().toISOString()
        }),
        // 5 second timeout
        signal: AbortSignal.timeout(5000)
      })

      if (!botResponse.ok) {
        throw new Error(`Bot API returned ${botResponse.status}`)
      }

      const botData = await botResponse.json()

      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Discord bot',
        botResponse: botData,
        timestamp: new Date().toISOString()
      })

    } catch (fetchError) {
      // If bot is not responding, return a mock response for development
      console.warn('Discord bot not available, returning mock response:', fetchError)
      
      return NextResponse.json({
        success: true,
        message: 'Mock response - Discord bot not available',
        botStatus: 'offline',
        serverCount: 0,
        timestamp: new Date().toISOString(),
        note: 'This is a development mock response. Deploy the Discord bot to Railway for real functionality.'
      })
    }

  } catch (error) {
    console.error('Bot connection test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to test bot connection'
      },
      { status: 500 }
    )
  }
}