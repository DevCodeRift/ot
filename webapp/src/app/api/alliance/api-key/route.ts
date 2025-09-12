import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/alliance/api-key - Get current alliance API key status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an alliance admin
    const allianceAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        discordId: session.user.discordId,
        isActive: true
      },
      include: {
        alliance: {
          include: {
            apiKey: true
          }
        }
      }
    })

    if (!allianceAdmin) {
      return NextResponse.json({ error: 'Not an alliance administrator' }, { status: 403 })
    }

    const hasApiKey = !!allianceAdmin.alliance.apiKey?.isActive
    
    return NextResponse.json({
      hasApiKey,
      alliance: {
        id: allianceAdmin.alliance.id,
        name: allianceAdmin.alliance.name,
        acronym: allianceAdmin.alliance.acronym
      }
    })

  } catch (error) {
    console.error('Get API key status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/alliance/api-key - Save alliance API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Check if user is an alliance admin
    const allianceAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        discordId: session.user.discordId,
        isActive: true
      },
      include: {
        alliance: true
      }
    })

    if (!allianceAdmin) {
      return NextResponse.json({ error: 'Not an alliance administrator' }, { status: 403 })
    }

    // Test the API key first using the correct P&W API format
    const testQuery = `{me{nation{id nation_name leader_name}}}`
    
    const testUrl = new URL('https://api.politicsandwar.com/graphql')
    testUrl.searchParams.set('api_key', apiKey)
    testUrl.searchParams.set('query', testQuery)

    const testResponse = await fetch(testUrl.toString(), {
      method: 'GET',
    })

    if (!testResponse.ok) {
      return NextResponse.json({ 
        error: `Invalid API key: ${testResponse.status}` 
      }, { status: 400 })
    }

    const testData = await testResponse.json()

    if (testData.errors) {
      return NextResponse.json({ 
        error: testData.errors[0]?.message || 'Invalid API key' 
      }, { status: 400 })
    }

    // Check if we got valid data back
    if (!testData.data?.me?.nation) {
      return NextResponse.json({ 
        error: 'API key validation failed - no nation data returned' 
      }, { status: 400 })
    }

    // Save or update the API key
    await prisma.allianceApiKey.upsert({
      where: {
        allianceId: allianceAdmin.allianceId
      },
      update: {
        apiKey: apiKey,
        isActive: true,
        lastUsed: new Date()
      },
      create: {
        allianceId: allianceAdmin.allianceId,
        apiKey: apiKey,
        isActive: true,
        addedBy: session.user.discordId || session.user.id
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'API key saved successfully' 
    })

  } catch (error) {
    console.error('Save API key error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
