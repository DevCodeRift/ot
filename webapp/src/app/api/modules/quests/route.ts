import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { QUEST_METRICS, COMPARISON_LABELS } from '@/types/quests'
import { checkAllianceAdminPermission } from '@/lib/alliance-admin'
import { checkModuleAccess } from '@/lib/module-access'

// Quest creation schema
const createQuestSchema = z.object({
  allianceId: z.number(),
  questGroupId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  questType: z.enum(['nation_metric', 'war_metric', 'alliance_metric', 'custom']),
  targetMetric: z.string(),
  targetValue: z.number().positive(),
  comparisonType: z.enum(['gte', 'lte', 'eq', 'gt', 'lt']).default('gte'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('easy'),
  estimatedTime: z.string().optional(),
  priority: z.number().min(1).max(5).default(1),
  isRepeatable: z.boolean().default(false),
  maxCompletions: z.number().positive().optional(),
  requiredLevel: z.number().min(0).default(0),
  prerequisites: z.array(z.string()).default([]),
  rewardType: z.enum(['experience', 'badge', 'resources', 'custom']).optional(),
  rewardValue: z.number().optional(),
  rewardData: z.record(z.string(), z.any()).optional(),
  displayOrder: z.number().default(0)
})

// Quest update schema
const updateQuestSchema = createQuestSchema.partial().omit({ allianceId: true })

// GET /api/modules/quests - Get quests for alliance
export async function GET(request: NextRequest) {
  try {
    // Check module access first
    const access = await checkModuleAccess('quests')
    
    if (!access.hasAccess) {
      return NextResponse.json({ 
        error: access.error || 'Access denied to quest module' 
      }, { status: 403 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const allianceId = url.searchParams.get('allianceId')
    const questGroupId = url.searchParams.get('questGroupId')
    const includeAssignments = url.searchParams.get('includeAssignments') === 'true'

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

    // Build where clause
    const whereClause: any = {
      allianceId: parseInt(allianceId)
    }

    if (questGroupId) {
      whereClause.questGroupId = questGroupId
    }

    // Get quests
    const quests = await prisma.quest.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            discordUsername: true
          }
        },
        questGroup: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        ...(includeAssignments && {
          assignments: {
            where: {
              status: 'active'
            },
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
        }),
        _count: {
          select: {
            assignments: true,
            completions: true,
            progress: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Format response with metric information
    const formattedQuests = quests.map((quest: any) => {
      const metric = QUEST_METRICS.find(m => m.id === quest.targetMetric)
      
      return {
        ...quest,
        metric: metric ? {
          name: metric.name,
          description: metric.description,
          category: metric.category,
          unit: metric.unit
        } : null,
        comparisonLabel: COMPARISON_LABELS[quest.comparisonType as keyof typeof COMPARISON_LABELS]
      }
    })

    return NextResponse.json({
      quests: formattedQuests
    })

  } catch (error) {
    console.error('Quests fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/modules/quests - Create new quest
export async function POST(request: NextRequest) {
  try {
    // Check module access first
    const access = await checkModuleAccess('quests')
    
    if (!access.hasAccess) {
      return NextResponse.json({ 
        error: access.error || 'Access denied to quest module' 
      }, { status: 403 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createQuestSchema.parse(body)

    // Check admin permissions using enhanced system
    const adminCheck = await checkAllianceAdminPermission(validatedData.allianceId, session)
    
    if (!adminCheck.hasPermission || adminCheck.adminLevel === 'none') {
      return NextResponse.json({ 
        error: 'Admin permissions required',
        details: adminCheck.reason
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

    // Validate target metric exists
    const metric = QUEST_METRICS.find(m => m.id === validatedData.targetMetric)
    if (!metric) {
      return NextResponse.json({ 
        error: 'Invalid target metric' 
      }, { status: 400 })
    }

    // Validate comparison type is supported for metric
    if (!metric.comparisonTypes.includes(validatedData.comparisonType)) {
      return NextResponse.json({ 
        error: `Comparison type '${validatedData.comparisonType}' not supported for metric '${metric.name}'` 
      }, { status: 400 })
    }

    // Validate target value range
    if (metric.minTarget && validatedData.targetValue < metric.minTarget) {
      return NextResponse.json({ 
        error: `Target value must be at least ${metric.minTarget} for ${metric.name}` 
      }, { status: 400 })
    }

    if (metric.maxTarget && validatedData.targetValue > metric.maxTarget) {
      return NextResponse.json({ 
        error: `Target value cannot exceed ${metric.maxTarget} for ${metric.name}` 
      }, { status: 400 })
    }

    // Validate quest group if provided
    if (validatedData.questGroupId) {
      const questGroup = await prisma.questGroup.findFirst({
        where: {
          id: validatedData.questGroupId,
          allianceId: validatedData.allianceId
        }
      })

      if (!questGroup) {
        return NextResponse.json({ 
          error: 'Invalid quest group' 
        }, { status: 400 })
      }
    }

    // Validate prerequisites exist
    if (validatedData.prerequisites.length > 0) {
      const prerequisiteQuests = await prisma.quest.findMany({
        where: {
          id: { in: validatedData.prerequisites },
          allianceId: validatedData.allianceId
        },
        select: { id: true }
      })

      if (prerequisiteQuests.length !== validatedData.prerequisites.length) {
        return NextResponse.json({ 
          error: 'One or more prerequisite quests not found' 
        }, { status: 400 })
      }
    }

    // Create quest
    const quest = await prisma.quest.create({
      data: {
        ...validatedData,
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            discordUsername: true
          }
        },
        questGroup: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'QUEST_CREATE',
        resource: 'quest',
        resourceId: quest.id,
        details: {
          allianceId: validatedData.allianceId,
          questName: validatedData.name,
          targetMetric: validatedData.targetMetric,
          targetValue: validatedData.targetValue
        }
      }
    })

    // Format response
    const formattedQuest = {
      ...quest,
      metric: metric ? {
        name: metric.name,
        description: metric.description,
        category: metric.category,
        unit: metric.unit
      } : null,
      comparisonLabel: COMPARISON_LABELS[quest.comparisonType as keyof typeof COMPARISON_LABELS],
      _count: {
        assignments: 0,
        completions: 0,
        progress: 0
      }
    }

    return NextResponse.json({
      success: true,
      quest: formattedQuest
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Quest creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
