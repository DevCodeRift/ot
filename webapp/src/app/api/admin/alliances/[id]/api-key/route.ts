import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/alliances/[id]/api-key - Save API key for specific alliance (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a system admin
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || []
    const isAdmin = session.user.discordId ? adminIds.includes(session.user.discordId) : false
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const allianceId = parseInt(id)
    
    if (isNaN(allianceId)) {
      return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
    }

    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Verify the alliance exists
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId }
    })

    if (!alliance) {
      return NextResponse.json({ error: 'Alliance not found' }, { status: 404 })
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
        allianceId: allianceId
      },
      update: {
        apiKey: apiKey,
        isActive: true,
        lastUsed: new Date()
      },
      create: {
        allianceId: allianceId,
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
    console.error('Admin save API key error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE /api/admin/alliances/[id]/api-key - Remove API key for specific alliance (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a system admin
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || []
    const isAdmin = session.user.discordId ? adminIds.includes(session.user.discordId) : false
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const allianceId = parseInt(id)
    
    if (isNaN(allianceId)) {
      return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
    }

    // Verify the alliance exists
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId }
    })

    if (!alliance) {
      return NextResponse.json({ error: 'Alliance not found' }, { status: 404 })
    }

    // Remove the API key
    await prisma.allianceApiKey.updateMany({
      where: {
        allianceId: allianceId
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'API key removed successfully' 
    })

  } catch (error) {
    console.error('Admin remove API key error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
