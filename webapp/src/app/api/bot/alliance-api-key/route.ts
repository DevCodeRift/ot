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

    // Find the alliance-specific API key
    const allianceApiKey = await prisma.allianceApiKey.findUnique({
      where: {
        allianceId: allianceIdNum,
        isActive: true
      },
      include: {
        alliance: {
          select: {
            name: true,
            acronym: true
          }
        }
      }
    })

    if (!allianceApiKey) {
      return NextResponse.json({ 
        error: 'No API key configured for this alliance',
        allianceId: allianceIdNum,
        details: 'Alliance administrators need to configure a P&W API key for war monitoring'
      }, { status: 404 })
    }

    // Update last used timestamp
    await prisma.allianceApiKey.update({
      where: { id: allianceApiKey.id },
      data: { lastUsed: new Date() }
    })

    return NextResponse.json({
      success: true,
      allianceId: allianceIdNum,
      apiKey: allianceApiKey.apiKey,
      keyName: allianceApiKey.keyName,
      allianceName: allianceApiKey.alliance.name,
      allianceAcronym: allianceApiKey.alliance.acronym,
      source: 'alliance-specific',
      message: 'Using alliance-configured API key for war monitoring'
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