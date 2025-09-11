import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin Discord IDs from environment
const ADMIN_DISCORD_IDS = process.env.ADMIN_DISCORD_IDS?.split(',') || []

async function isAdmin(session: any): Promise<boolean> {
  if (!session?.user?.discordId) return false
  return ADMIN_DISCORD_IDS.includes(session.user.discordId)
}

// GET /api/admin/alliance-modules - List all alliances and their module access
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const alliances = await prisma.alliance.findMany({
      include: {
        allianceModules: {
          include: {
            module: true
          }
        },
        _count: {
          select: {
            nations: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const modules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      alliances: alliances.map(alliance => ({
        id: alliance.id,
        name: alliance.name,
        acronym: alliance.acronym,
        memberCount: alliance._count.nations,
        enabledModules: alliance.allianceModules
          .filter(am => am.enabled)
          .map(am => ({
            id: am.module.id,
            name: am.module.name,
            enabledAt: am.enabledAt,
            enabledBy: am.enabledBy
          }))
      })),
      availableModules: modules
    })

  } catch (error) {
    console.error('Admin alliance modules fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/admin/alliance-modules - Enable/disable module for alliance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { allianceId, moduleId, enabled } = await request.json()

    if (!allianceId || !moduleId || typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        error: 'allianceId, moduleId, and enabled (boolean) are required' 
      }, { status: 400 })
    }

    // Verify alliance exists
    const alliance = await prisma.alliance.findUnique({
      where: { id: parseInt(allianceId) }
    })

    if (!alliance) {
      return NextResponse.json({ error: 'Alliance not found' }, { status: 404 })
    }

    // Verify module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Upsert alliance module access
    const allianceModule = await prisma.allianceModule.upsert({
      where: {
        allianceId_moduleId: {
          allianceId: parseInt(allianceId),
          moduleId: moduleId
        }
      },
      update: {
        enabled: enabled,
        enabledBy: enabled ? session.user.id : null,
        enabledAt: enabled ? new Date() : undefined
      },
      create: {
        allianceId: parseInt(allianceId),
        moduleId: moduleId,
        enabled: enabled,
        enabledBy: enabled ? session.user.id : null
      },
      include: {
        module: true,
        alliance: true
      }
    })

    console.log(`🔧 Admin ${session.user.discordUsername || session.user.id} ${enabled ? 'enabled' : 'disabled'} module "${module.name}" for alliance "${alliance.name}"`)

    return NextResponse.json({
      success: true,
      action: enabled ? 'enabled' : 'disabled',
      alliance: {
        id: alliance.id,
        name: alliance.name
      },
      module: {
        id: module.id,
        name: module.name
      },
      allianceModule
    })

  } catch (error) {
    console.error('Admin alliance module update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
