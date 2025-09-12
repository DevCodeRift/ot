import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Quest Group creation schema
const createQuestGroupSchema = z.object({
  allianceId: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().default(0)
})

// Quest Group update schema
const updateQuestGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

// GET /api/modules/quests/groups - Get quest groups for alliance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const allianceId = url.searchParams.get('allianceId')

    if (!allianceId) {
      return NextResponse.json({ 
        error: 'Alliance ID is required' 
      }, { status: 400 })
    }

    // Check module access
    const moduleAccess = await prisma.allianceModule.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        moduleId: 'quests',
        enabled: true
      }
    })

    if (!moduleAccess) {
      return NextResponse.json({ 
        error: 'Quest module not enabled for this alliance' 
      }, { status: 403 })
    }

    // Get quest groups with quest counts
    const questGroups = await prisma.questGroup.findMany({
      where: {
        allianceId: parseInt(allianceId)
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            discordUsername: true
          }
        },
        quests: {
          select: {
            id: true,
            isActive: true
          }
        },
        assignments: {
          where: {
            status: 'active'
          },
          select: {
            id: true
          }
        },
        _count: {
          select: {
            quests: true,
            assignments: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Format response
    const formattedGroups = questGroups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      icon: group.icon,
      color: group.color,
      isActive: group.isActive,
      displayOrder: group.displayOrder,
      questCount: group.quests.filter(q => q.isActive).length,
      totalQuests: group._count.quests,
      activeAssignments: group._count.assignments,
      creator: group.creator,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }))

    return NextResponse.json({
      questGroups: formattedGroups
    })

  } catch (error) {
    console.error('Quest groups fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/modules/quests/groups - Create new quest group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createQuestGroupSchema.parse(body)

    // Check admin permissions
    const isAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId: validatedData.allianceId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin permissions required' 
      }, { status: 403 })
    }

    // Check module access
    const moduleAccess = await prisma.allianceModule.findFirst({
      where: {
        allianceId: validatedData.allianceId,
        moduleId: 'quests',
        enabled: true
      }
    })

    if (!moduleAccess) {
      return NextResponse.json({ 
        error: 'Quest module not enabled for this alliance' 
      }, { status: 403 })
    }

    // Create quest group
    const questGroup = await prisma.questGroup.create({
      data: {
        allianceId: validatedData.allianceId,
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
        displayOrder: validatedData.displayOrder,
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            discordUsername: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'QUEST_GROUP_CREATE',
        resource: 'quest_group',
        resourceId: questGroup.id,
        details: {
          allianceId: validatedData.allianceId,
          groupName: validatedData.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      questGroup: {
        id: questGroup.id,
        name: questGroup.name,
        description: questGroup.description,
        icon: questGroup.icon,
        color: questGroup.color,
        isActive: questGroup.isActive,
        displayOrder: questGroup.displayOrder,
        questCount: 0,
        totalQuests: 0,
        activeAssignments: 0,
        creator: questGroup.creator,
        createdAt: questGroup.createdAt,
        updatedAt: questGroup.updatedAt
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Quest group creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
