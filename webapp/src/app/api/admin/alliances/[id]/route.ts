import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/alliances/[id] - Get alliance details (admin only)
export async function GET(
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

    // Get alliance details with modules and user count
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: {
        allianceModules: {
          include: {
            module: true
          }
        },
        nations: {
          select: {
            id: true,
            nationName: true,
            leaderName: true,
            createdAt: true
          }
        },
        apiKey: true,
        _count: {
          select: {
            nations: true,
            allianceModules: true
          }
        }
      }
    })

    if (!alliance) {
      return NextResponse.json({ error: 'Alliance not found' }, { status: 404 })
    }

    return NextResponse.json({
      alliance: {
        id: alliance.id,
        name: alliance.name,
        acronym: alliance.acronym,
        hasApiKey: !!alliance.apiKey,
        nationCount: alliance._count.nations,
        moduleCount: alliance._count.allianceModules,
        enabledModules: alliance.allianceModules
          .filter((am: any) => am.enabled)
          .map((am: any) => ({
            id: am.module.id,
            name: am.module.name,
            category: am.module.category,
            enabledAt: am.enabledAt,
            enabledBy: am.enabledBy
          })),
        nations: alliance.nations,
        createdAt: alliance.createdAt,
        updatedAt: alliance.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching alliance details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/alliances/[id] - Update alliance details (admin only)
export async function PUT(
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

    const { name, acronym } = await request.json()

    // Update alliance
    const alliance = await prisma.alliance.update({
      where: { id: allianceId },
      data: {
        ...(name && { name }),
        ...(acronym && { acronym }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      alliance: {
        id: alliance.id,
        name: alliance.name,
        acronym: alliance.acronym,
        updatedAt: alliance.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating alliance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}