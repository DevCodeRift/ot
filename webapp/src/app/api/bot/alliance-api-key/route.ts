import { NextRequest, NextResponse } from 'next/server'

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

    // Use system-wide P&W API key for monitoring all alliances
    const systemApiKey = process.env.POLITICS_AND_WAR_API_KEY
    
    if (!systemApiKey) {
      return NextResponse.json({ 
        error: 'System P&W API key not configured',
        details: 'Server administrator needs to set POLITICS_AND_WAR_API_KEY environment variable'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      allianceId: allianceIdNum,
      apiKey: systemApiKey,
      source: 'system',
      message: 'Using system API key for alliance-wide monitoring'
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