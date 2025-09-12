import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin Discord IDs from environment
const ADMIN_DISCORD_IDS = process.env.ADMIN_DISCORD_IDS?.split(',') || []

async function isGlobalAdmin(session: any): Promise<boolean> {
  if (!session?.user?.discordId) return false
  return ADMIN_DISCORD_IDS.includes(session.user.discordId)
}

// GET /api/admin/alliances - List all alliances with admin info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isGlobalAdmin(session))) {
      return NextResponse.json({ error: 'Global admin access required' }, { status: 403 })
    }

    const alliances = await prisma.alliance.findMany({
      include: {
        allianceAdmins: {
          include: {
            user: {
              select: {
                id: true,
                discordId: true,
                discordUsername: true
              }
            }
          },
          where: { isActive: true }
        },
        apiKey: true,
        _count: {
          select: {
            nations: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      alliances: alliances.map((alliance) => ({
        id: alliance.id,
        name: alliance.name,
        acronym: alliance.acronym,
        memberCount: alliance._count.nations,
        hasApiKey: !!alliance.apiKey?.isActive,
        admins: alliance.allianceAdmins.map((admin) => ({
          id: admin.id,
          discordId: admin.discordId,
          discordUsername: admin.user.discordUsername,
          role: admin.role,
          addedAt: admin.addedAt.toISOString()
        }))
      }))
    })

  } catch (error) {
    console.error('Alliance fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/admin/alliances - Add new alliance with admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isGlobalAdmin(session))) {
      return NextResponse.json({ error: 'Global admin access required' }, { status: 403 })
    }

    const { allianceId, name, acronym, adminDiscordId } = await request.json()

    if (!allianceId || !name || !adminDiscordId) {
      return NextResponse.json({ 
        error: 'Alliance ID, name, and admin Discord ID are required' 
      }, { status: 400 })
    }

    const parsedAllianceId = parseInt(allianceId)
    if (isNaN(parsedAllianceId)) {
      return NextResponse.json({ 
        error: 'Invalid alliance ID' 
      }, { status: 400 })
    }

    // Check if alliance already exists
    const existingAlliance = await prisma.alliance.findUnique({
      where: { id: parsedAllianceId }
    })

    if (existingAlliance) {
      return NextResponse.json({ 
        error: 'Alliance already exists' 
      }, { status: 400 })
    }

    // Find or create user for the admin Discord ID
    let adminUser = await prisma.user.findUnique({
      where: { discordId: adminDiscordId }
    })

    if (!adminUser) {
      // Create a placeholder user for the admin
      adminUser = await prisma.user.create({
        data: {
          discordId: adminDiscordId,
          name: `Alliance Admin (${adminDiscordId})`,
          discordUsername: `Alliance Admin (${adminDiscordId})`
        }
      })
    }

    // Create the alliance
    const alliance = await prisma.alliance.create({
      data: {
        id: parsedAllianceId,
        name: name,
        acronym: acronym || null
      }
    })

    // Add the admin
    await prisma.allianceAdmin.create({
      data: {
        allianceId: parsedAllianceId,
        userId: adminUser.id,
        discordId: adminDiscordId,
        role: 'owner',
        permissions: ['admin', 'api_key', 'modules', 'members'],
        addedBy: session.user.id
      }
    })

    console.log(`🏛️ Global admin ${session.user.discordUsername || session.user.id} added alliance "${name}" (${parsedAllianceId}) with admin ${adminDiscordId}`)

    return NextResponse.json({
      success: true,
      alliance: {
        id: alliance.id,
        name: alliance.name,
        acronym: alliance.acronym
      },
      admin: {
        discordId: adminDiscordId,
        role: 'owner'
      }
    })

  } catch (error) {
    console.error('Alliance creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
