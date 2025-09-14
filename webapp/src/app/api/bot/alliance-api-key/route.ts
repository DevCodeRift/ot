import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check for bot authentication
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.WEBAPP_BOT_SECRET}`
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const allianceId = searchParams.get('allianceId')
    
    if (!allianceId) {
      return NextResponse.json({ error: 'allianceId parameter required' }, { status: 400 })
    }

    const allianceIdNum = parseInt(allianceId)
    if (isNaN(allianceIdNum)) {
      return NextResponse.json({ error: 'Invalid allianceId' }, { status: 400 })
    }

    // Find users from this alliance who have API keys
    const usersWithApiKeys = await prisma.user.findMany({
      where: {
        currentAllianceId: allianceIdNum,
        pwApiKey: {
          not: null
        }
      },
      select: {
        id: true,
        pwApiKey: true,
        pwNationName: true,
        pwNationId: true
      },
      take: 1 // Just need one API key for the alliance
    })

    if (usersWithApiKeys.length === 0) {
      return NextResponse.json({ 
        error: 'No P&W API key found for this alliance',
        details: 'Alliance members need to connect their P&W accounts and provide API keys'
      }, { status: 404 })
    }

    const user = usersWithApiKeys[0]
    
    return NextResponse.json({
      success: true,
      allianceId: allianceIdNum,
      apiKey: user.pwApiKey,
      providedBy: {
        nationName: user.pwNationName,
        nationId: user.pwNationId
      }
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