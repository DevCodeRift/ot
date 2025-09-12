import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Assignment schemas
const assignQuestSchema = z.object({
  allianceId: z.number(),
  questId: z.string(),
  assignedToId: z.string(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional()
})

const assignQuestGroupSchema = z.object({
  allianceId: z.number(),
  questGroupId: z.string(),
  assignedToId: z.string(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional()
})

const bulkAssignSchema = z.object({
  allianceId: z.number(),
  questId: z.string().optional(),
  questGroupId: z.string().optional(),
  assignedToIds: z.array(z.string()),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional()
}).refine(data => data.questId || data.questGroupId, {
  message: "Either questId or questGroupId must be provided"
})

// GET /api/modules/quests/assignments - Get assignments for alliance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const allianceId = url.searchParams.get('allianceId')
    const userId = url.searchParams.get('userId')
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type') // 'quest' or 'group'

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

    // Build where clauses
    const questWhereClause: any = {
      allianceId: parseInt(allianceId)
    }

    const groupWhereClause: any = {
      allianceId: parseInt(allianceId)
    }

    if (userId) {
      questWhereClause.assignedToId = userId
      groupWhereClause.assignedToId = userId
    }

    if (status) {
      questWhereClause.status = status
      groupWhereClause.status = status
    }

    let questAssignments: any[] = []
    let groupAssignments: any[] = []

    // Get quest assignments
    if (!type || type === 'quest') {
      questAssignments = await prisma.questAssignment.findMany({
        where: questWhereClause,
        include: {
          quest: {
            include: {
              questGroup: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  icon: true
                }
              }
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              discordUsername: true,
              pwNationName: true,
              pwNationId: true
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
      })
    }

    // Get quest group assignments
    if (!type || type === 'group') {
      groupAssignments = await prisma.questGroupAssignment.findMany({
        where: groupWhereClause,
        include: {
          questGroup: {
            include: {
              quests: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  targetMetric: true,
                  targetValue: true,
                  comparisonType: true,
                  difficulty: true
                }
              }
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              discordUsername: true,
              pwNationName: true,
              pwNationId: true
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
      })
    }

    return NextResponse.json({
      questAssignments,
      groupAssignments
    })

  } catch (error) {
    console.error('Quest assignments fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/modules/quests/assignments - Create quest assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assignQuestSchema.parse(body)

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

    // Verify quest exists and belongs to alliance
    const quest = await prisma.quest.findFirst({
      where: {
        id: validatedData.questId,
        allianceId: validatedData.allianceId,
        isActive: true
      }
    })

    if (!quest) {
      return NextResponse.json({ 
        error: 'Quest not found or not active' 
      }, { status: 404 })
    }

    // Check if already assigned
    const existingAssignment = await prisma.questAssignment.findUnique({
      where: {
        questId_assignedToId: {
          questId: validatedData.questId,
          assignedToId: validatedData.assignedToId
        }
      }
    })

    if (existingAssignment && existingAssignment.status === 'active') {
      return NextResponse.json({ 
        error: 'Quest already assigned to this user' 
      }, { status: 400 })
    }

    // Create or update assignment
    const assignment = await prisma.questAssignment.upsert({
      where: {
        questId_assignedToId: {
          questId: validatedData.questId,
          assignedToId: validatedData.assignedToId
        }
      },
      update: {
        status: 'active',
        assignedById: session.user.id,
        assignedAt: new Date(),
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        notes: validatedData.notes,
        completedAt: null
      },
      create: {
        allianceId: validatedData.allianceId,
        questId: validatedData.questId,
        assignedToId: validatedData.assignedToId,
        assignedById: session.user.id,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        notes: validatedData.notes
      },
      include: {
        quest: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            discordUsername: true,
            pwNationName: true
          }
        }
      }
    })

    // Initialize quest progress tracking
    await prisma.questProgress.upsert({
      where: {
        questId_userId: {
          questId: validatedData.questId,
          userId: validatedData.assignedToId
        }
      },
      update: {
        isCompleted: false,
        completedAt: null
      },
      create: {
        allianceId: validatedData.allianceId,
        questId: validatedData.questId,
        userId: validatedData.assignedToId,
        currentValue: 0
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'QUEST_ASSIGN',
        resource: 'quest_assignment',
        resourceId: assignment.id,
        details: {
          allianceId: validatedData.allianceId,
          questId: validatedData.questId,
          questName: quest.name,
          assignedToId: validatedData.assignedToId
        }
      }
    })

    return NextResponse.json({
      success: true,
      assignment
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Quest assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
