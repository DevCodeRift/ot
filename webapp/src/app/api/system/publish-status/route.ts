import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allianceId } = await request.json()

    // Get current system status
    const statusResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/system/status?allianceId=${allianceId}`, {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    })

    if (!statusResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch system status' }, { status: 500 })
    }

    const systemStatus = await statusResponse.json()

    // Send status to Discord bot for publishing
    const botUrl = process.env.DISCORD_BOT_URL || 'http://localhost:3001'
    const discordResponse = await fetch(`${botUrl}/api/publish-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allianceId,
        systemStatus,
        requestedBy: session.user.discordUsername || session.user.name
      })
    })

    if (!discordResponse.ok) {
      const error = await discordResponse.text()
      return NextResponse.json({ 
        error: 'Failed to publish to Discord', 
        details: error 
      }, { status: 500 })
    }

    const result = await discordResponse.json()
    return NextResponse.json({ 
      success: true, 
      message: 'Status published to Discord successfully',
      details: result
    })

  } catch (error) {
    console.error('Failed to publish status to Discord:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}