import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PoliticsWarAPI } from '@/lib/politics-war-api'
import { QUEST_METRICS, isQuestCompleted, calculateProgress, QUEST_MILESTONES } from '@/types/quests'

// GET /api/modules/quests/progress - Get quest progress for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const allianceId = url.searchParams.get('allianceId')
    const userId = url.searchParams.get('userId') || session.user.id

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

    // Get user's quest progress
    const questProgress = await prisma.questProgress.findMany({
      where: {
        allianceId: parseInt(allianceId),
        userId: userId
      },
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
        user: {
          select: {
            id: true,
            name: true,
            discordUsername: true,
            pwNationName: true,
            pwNationId: true
          }
        }
      },
      orderBy: [
        { quest: { displayOrder: 'asc' } },
        { quest: { createdAt: 'asc' } }
      ]
    })

    // Format progress with metric information
    const formattedProgress = questProgress.map((progress: any) => {
      const metric = QUEST_METRICS.find(m => m.id === progress.quest.targetMetric)
      const progressPercentage = calculateProgress(
        progress.currentValue,
        progress.quest.targetValue,
        progress.quest.comparisonType as any
      )

      return {
        ...progress,
        metric: metric ? {
          name: metric.name,
          description: metric.description,
          category: metric.category,
          unit: metric.unit
        } : null,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        isCompleted: isQuestCompleted(
          progress.currentValue,
          progress.quest.targetValue,
          progress.quest.comparisonType as any
        )
      }
    })

    return NextResponse.json({
      questProgress: formattedProgress
    })

  } catch (error) {
    console.error('Quest progress fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/modules/quests/progress/update - Update quest progress from P&W API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { allianceId, userId } = body

    if (!allianceId) {
      return NextResponse.json({ 
        error: 'Alliance ID is required' 
      }, { status: 400 })
    }

    const targetUserId = userId || session.user.id

    // Get user's P&W data
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        pwApiKey: true, 
        pwNationId: true,
        name: true
      }
    })

    if (!user?.pwNationId) {
      return NextResponse.json({ 
        error: 'User nation ID not found' 
      }, { status: 400 })
    }

    // Use alliance API key for data fetching if available, fallback to user key
    let apiKey = user.pwApiKey
    const allianceApiKey = await prisma.allianceApiKey.findUnique({
      where: { allianceId: parseInt(allianceId) },
      select: { apiKey: true }
    })

    if (allianceApiKey?.apiKey) {
      apiKey = allianceApiKey.apiKey
    }

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No P&W API key available for progress tracking' 
      }, { status: 400 })
    }

    // Initialize P&W API client
    const pwApi = new PoliticsWarAPI(apiKey)

    // Get active quest assignments for user
    const activeQuests = await prisma.questProgress.findMany({
      where: {
        allianceId: parseInt(allianceId),
        userId: targetUserId,
        isCompleted: false
      },
      include: {
        quest: true
      }
    })

    if (activeQuests.length === 0) {
      return NextResponse.json({
        message: 'No active quests to update',
        updatedCount: 0
      })
    }

    // Fetch nation data from P&W API
    let nationData
    try {
      const nationResponse = await pwApi.getNation(user.pwNationId)
      
      if (!nationResponse) {
        throw new Error('Nation not found in P&W API')
      }
      
      nationData = nationResponse
    } catch (pwError) {
      console.error('P&W API Error:', pwError)
      return NextResponse.json({
        error: 'Failed to fetch nation data from P&W API',
        details: pwError instanceof Error ? pwError.message : 'Unknown P&W API error'
      }, { status: 400 })
    }

    // Get additional data for custom metrics
    const customData = await getCustomMetrics(pwApi, user.pwNationId, parseInt(allianceId))

    // Update progress for each quest
    const updates = []
    const completions = []

    for (const questProgress of activeQuests) {
      const quest = questProgress.quest
      const metric = QUEST_METRICS.find(m => m.id === quest.targetMetric)
      
      if (!metric) {
        console.warn(`Unknown metric: ${quest.targetMetric}`)
        continue
      }

      // Extract current value based on metric path
      let currentValue = 0
      
      if (metric.dataPath.startsWith('custom.')) {
        const customKey = metric.dataPath.replace('custom.', '')
        currentValue = customData[customKey] || 0
      } else if (metric.dataPath.includes('.')) {
        // Handle nested paths like 'cities.infrastructure'
        const parts = metric.dataPath.split('.')
        let value: any = nationData
        for (const part of parts) {
          if (Array.isArray(value)) {
            // Sum array values (like total infrastructure across cities)
            value = value.reduce((sum: number, item: any) => sum + (item[part] || 0), 0)
          } else {
            value = value?.[part]
          }
        }
        currentValue = Number(value) || 0
      } else {
        // Direct property access
        currentValue = Number((nationData as any)[metric.dataPath]) || 0
      }

      // Calculate new milestones reached
      const newProgressPercentage = calculateProgress(
        currentValue,
        quest.targetValue,
        quest.comparisonType as any
      )

      const currentMilestones = questProgress.milestonesPassed || []
      const newMilestones = [...currentMilestones]

      QUEST_MILESTONES.forEach(milestone => {
        if (newProgressPercentage >= milestone && !currentMilestones.includes(milestone.toString())) {
          newMilestones.push(milestone.toString())
        }
      })

      // Check if quest is now completed
      const isCompleted = isQuestCompleted(
        currentValue,
        quest.targetValue,
        quest.comparisonType as any
      )

      // Update progress
      const updatedProgress = await prisma.questProgress.update({
        where: { id: questProgress.id },
        data: {
          currentValue,
          lastCheckedAt: new Date(),
          milestonesPassed: newMilestones,
          isCompleted,
          completedAt: isCompleted && !questProgress.isCompleted ? new Date() : questProgress.completedAt,
          dataSnapshot: {
            nationData: {
              score: (nationData as any).score,
              cities: (nationData as any).cities,
              population: (nationData as any).population
            },
            customData,
            timestamp: new Date().toISOString()
          }
        }
      })

      updates.push({
        questId: quest.id,
        questName: quest.name,
        previousValue: questProgress.currentValue,
        currentValue,
        progressPercentage: Math.round(newProgressPercentage * 100) / 100,
        isCompleted,
        newMilestones: newMilestones.filter(m => !currentMilestones.includes(m))
      })

      // Handle quest completion
      if (isCompleted && !questProgress.isCompleted) {
        const completion = await prisma.questCompletion.create({
          data: {
            allianceId: parseInt(allianceId),
            questId: quest.id,
            userId: targetUserId,
            finalValue: currentValue,
            completionType: 'automatic',
            dataSnapshot: updatedProgress.dataSnapshot as any
          }
        })

        // Update assignment status
        await prisma.questAssignment.updateMany({
          where: {
            questId: quest.id,
            assignedToId: targetUserId,
            status: 'active'
          },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        })

        completions.push({
          questId: quest.id,
          questName: quest.name,
          completionId: completion.id
        })

        // Create completion notification
        await prisma.questNotification.create({
          data: {
            allianceId: parseInt(allianceId),
            questId: quest.id,
            userId: targetUserId,
            type: 'quest_completed',
            title: 'Quest Completed!',
            message: `${user.name || 'Member'} has completed the quest "${quest.name}"`,
            sendToUser: true,
            sendToAdmins: true,
            sendToDiscord: true
          }
        })
      }

      // Create milestone notifications
      if (newMilestones.length > currentMilestones.length) {
        const latestMilestone = Math.max(...newMilestones.map(Number))
        await prisma.questNotification.create({
          data: {
            allianceId: parseInt(allianceId),
            questId: quest.id,
            userId: targetUserId,
            type: 'milestone_reached',
            title: 'Quest Milestone Reached!',
            message: `${user.name || 'Member'} reached ${latestMilestone}% progress on "${quest.name}"`,
            sendToUser: true,
            sendToAdmins: false,
            sendToDiscord: false
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated progress for ${updates.length} quests`,
      updates,
      completions,
      updatedCount: updates.length,
      completedCount: completions.length
    })

  } catch (error) {
    console.error('Quest progress update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to get custom metrics that require additional API calls
async function getCustomMetrics(pwApi: PoliticsWarAPI, nationId: number, allianceId: number) {
  const customData: Record<string, number> = {}

  try {
    // For now, we'll implement basic war counting using a simplified approach
    // since we need to update the PoliticsWarAPI class to support war queries
    
    // Placeholder implementation - in a real system, this would query wars
    // from the P&W API or maintain a local cache of war data
    
    customData.warsWon = 0 // Would count wars where nation was winner
    customData.warsDeclared = 0 // Would count wars where nation was attacker
    customData.defensiveWars = 0 // Would count wars where nation was defender
    
    // Calculate alliance membership days
    // This would require tracking join date - for now use a placeholder
    customData.allianceDays = 30 // Placeholder

    // Calculate login streak - would need additional tracking
    customData.loginStreak = 7 // Placeholder

  } catch (error) {
    console.warn('Error fetching custom metrics:', error)
    // Return defaults for any metrics that failed to fetch
  }

  return customData
}
