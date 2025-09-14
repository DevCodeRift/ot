import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { allianceId: string } }
) {
  try {
    // Check for bot authentication
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.WEBAPP_BOT_SECRET}`
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allianceId = parseInt(params.allianceId)
    
    if (isNaN(allianceId)) {
      return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
    }

    // Find a user from this alliance who has a P&W API key
    // Look for alliance admin or any user with API key
    const userWithApiKey = await prisma.user.findFirst({
      where: {
        currentAllianceId: allianceId,
        pwApiKey: { not: null }
      },
      select: {
        pwApiKey: true,
        pwNationName: true
      },
      orderBy: [
        { createdAt: 'asc' } // Get the oldest user (likely an admin)
      ]
    })

    if (!userWithApiKey?.pwApiKey) {
      return NextResponse.json({ 
        error: 'No P&W API key found for this alliance',
        allianceId,
        available: false
      }, { status: 404 })
    }

    return NextResponse.json({
      apiKey: userWithApiKey.pwApiKey,
      allianceId,
      available: true,
      source: userWithApiKey.pwNationName || 'Unknown nation'
    })

  } catch (error) {
    console.error('Error fetching alliance API key:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}