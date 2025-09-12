import { NextRe// GET /api/modules/quests/groups/[id] - Get specific quest group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateQuestGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

// GET /api/modules/quests/groups/[id] - Get specific quest group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const questGroup = await prisma.questGroup.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            discordUsername: true
          }
        },
        quests: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                discordUsername: true
              }
            },
            assignments: {
              where: {
                status: 'active'
              },
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    discordUsername: true
                  }
                }
              }
            },
            _count: {
              select: {
                assignments: true,
                completions: true
              }
            }
          },
          orderBy: [
            { displayOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        },
        assignments: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                discordUsername: true,
                pwNationName: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                name: true,
                discordUsername: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }
      }
    })

    if (!questGroup) {
      return NextResponse.json({ 
        error: 'Quest group not found' 
      }, { status: 404 })
    }

    // Check module access for the alliance
    const moduleAccess = await prisma.allianceModule.findFirst({
      where: {
        allianceId: questGroup.allianceId,
        moduleId: 'quests',
        enabled: true
      }
    })

    if (!moduleAccess) {
      return NextResponse.json({ 
        error: 'Quest module not enabled for this alliance' 
      }, { status: 403 })
    }

    return NextResponse.json({ questGroup })

  } catch (error) {
    console.error('Quest group fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// PUT /api/modules/quests/groups/[id] - Update quest group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateQuestGroupSchema.parse(body)

    // Get quest group to check alliance
    const questGroup = await prisma.questGroup.findUnique({
      where: { id: params.id },
      select: { allianceId: true }
    })

    if (!questGroup) {
      return NextResponse.json({ 
        error: 'Quest group not found' 
      }, { status: 404 })
    }

    // Check admin permissions
    const isAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId: questGroup.allianceId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin permissions required' 
      }, { status: 403 })
    }

    // Update quest group
    const updatedQuestGroup = await prisma.questGroup.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            discordUsername: true
          }
        },
        _count: {
          select: {
            quests: true,
            assignments: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'QUEST_GROUP_UPDATE',
        resource: 'quest_group',
        resourceId: params.id,
        details: {
          allianceId: questGroup.allianceId,
          changes: validatedData
        }
      }
    })

    return NextResponse.json({
      success: true,
      questGroup: updatedQuestGroup
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Quest group update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE /api/modules/quests/groups/[id] - Delete quest group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get quest group to check alliance and dependencies
    const questGroup = await prisma.questGroup.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            quests: true,
            assignments: true
          }
        }
      }
    })

    if (!questGroup) {
      return NextResponse.json({ 
        error: 'Quest group not found' 
      }, { status: 404 })
    }

    // Check admin permissions
    const isAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId: questGroup.allianceId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin permissions required' 
      }, { status: 403 })
    }

    // Check if group has active assignments
    if (questGroup._count.assignments > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete quest group with active assignments. Please cancel or complete all assignments first.' 
      }, { status: 400 })
    }

    // If group has quests, orphan them (set questGroupId to null)
    if (questGroup._count.quests > 0) {
      await prisma.quest.updateMany({
        where: { questGroupId: params.id },
        data: { questGroupId: null }
      })
    }

    // Delete quest group
    await prisma.questGroup.delete({
      where: { id: params.id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'QUEST_GROUP_DELETE',
        resource: 'quest_group',
        resourceId: params.id,
        details: {
          allianceId: questGroup.allianceId,
          groupName: questGroup.name,
          orphanedQuests: questGroup._count.quests
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Quest group deleted. ${questGroup._count.quests} quests were moved to ungrouped.`
    })

  } catch (error) {
    console.error('Quest group deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
