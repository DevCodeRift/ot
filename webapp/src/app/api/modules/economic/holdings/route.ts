import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/modules/economic/holdings - Get user's holdings balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const allianceId = searchParams.get('allianceId')
    
    if (!allianceId) {
      return NextResponse.json({ error: 'Alliance ID is required' }, { status: 400 })
    }

    console.log('Fetching holdings for user', session.user.id, 'in alliance', allianceId)

    // Check if user has access to the banking module for this alliance
    const moduleAccess = await prisma.allianceModule.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        moduleId: 'banking',
        enabled: true
      }
    })

    if (!moduleAccess) {
      return NextResponse.json({ 
        error: 'Banking module not enabled for this alliance' 
      }, { status: 403 })
    }

    // Get or create user's holdings for this alliance
    let holdings = await prisma.memberHolding.findUnique({
      where: {
        userId_allianceId: {
          userId: session.user.id,
          allianceId: parseInt(allianceId)
        }
      },
      include: {
        alliance: {
          select: {
            id: true,
            name: true,
            acronym: true
          }
        }
      }
    })

    // If no holdings exist, create with zero balances
    if (!holdings) {
      holdings = await prisma.memberHolding.create({
        data: {
          userId: session.user.id,
          allianceId: parseInt(allianceId)
        },
        include: {
          alliance: {
            select: {
              id: true,
              name: true,
              acronym: true
            }
          }
        }
      })
    }

    // Get recent transactions
    const recentTransactions = await prisma.holdingTransaction.findMany({
      where: {
        holdingId: holdings.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Last 20 transactions
    })

    // Calculate total deposited vs withdrawn for display
    const totalDeposited = recentTransactions
      .filter((t: any) => t.type === 'deposit')
      .reduce((sum: number, t: any) => sum + (t.money || 0), 0)
      
    const totalWithdrawn = recentTransactions
      .filter((t: any) => t.type === 'withdraw')
      .reduce((sum: number, t: any) => sum + (t.money || 0), 0)

    return NextResponse.json({
      success: true,
      holdings: {
        id: holdings.id,
        alliance: holdings.alliance,
        balances: {
          money: holdings.money,
          coal: holdings.coal,
          oil: holdings.oil,
          uranium: holdings.uranium,
          iron: holdings.iron,
          bauxite: holdings.bauxite,
          lead: holdings.lead,
          gasoline: holdings.gasoline,
          munitions: holdings.munitions,
          steel: holdings.steel,
          aluminum: holdings.aluminum,
          food: holdings.food
        },
        summary: {
          totalDeposited: holdings.totalDeposited,
          totalWithdrawn: holdings.totalWithdrawn,
          lifetimeDeposited: totalDeposited,
          lifetimeWithdrawn: totalWithdrawn
        },
        updatedAt: holdings.updatedAt
      },
      recentTransactions: recentTransactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        resources: {
          money: t.money,
          coal: t.coal,
          oil: t.oil,
          uranium: t.uranium,
          iron: t.iron,
          bauxite: t.bauxite,
          lead: t.lead,
          gasoline: t.gasoline,
          munitions: t.munitions,
          steel: t.steel,
          aluminum: t.aluminum,
          food: t.food
        },
        note: t.note,
        createdAt: t.createdAt
      }))
    })

  } catch (error) {
    console.error('Get holdings error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/modules/economic/holdings - Deposit to holdings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { allianceId, resources, note } = body

    if (!allianceId || !resources) {
      return NextResponse.json({ 
        error: 'Alliance ID and resources are required' 
      }, { status: 400 })
    }

    // Validate that at least one resource is being deposited
    const resourceKeys = ['money', 'coal', 'oil', 'uranium', 'iron', 'bauxite', 'lead', 'gasoline', 'munitions', 'steel', 'aluminum', 'food']
    const hasResources = resourceKeys.some(key => resources[key] && resources[key] > 0)
    
    if (!hasResources) {
      return NextResponse.json({ 
        error: 'At least one resource must be deposited' 
      }, { status: 400 })
    }

    console.log('Processing deposit for user', session.user.id, 'in alliance', allianceId)

    // Check module access
    const moduleAccess = await prisma.allianceModule.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        moduleId: 'banking',
        enabled: true
      }
    })

    if (!moduleAccess) {
      return NextResponse.json({ 
        error: 'Banking module not enabled for this alliance' 
      }, { status: 403 })
    }

    // Get or create user's holdings
    let holdings = await prisma.memberHolding.findUnique({
      where: {
        userId_allianceId: {
          userId: session.user.id,
          allianceId: parseInt(allianceId)
        }
      }
    })

    if (!holdings) {
      holdings = await prisma.memberHolding.create({
        data: {
          userId: session.user.id,
          allianceId: parseInt(allianceId)
        }
      })
    }

    // Calculate money value of deposit for tracking
    const moneyValue = resources.money || 0

    // Update holdings balances and totals
    const updatedHoldings = await prisma.memberHolding.update({
      where: { id: holdings.id },
      data: {
        money: { increment: resources.money || 0 },
        coal: { increment: resources.coal || 0 },
        oil: { increment: resources.oil || 0 },
        uranium: { increment: resources.uranium || 0 },
        iron: { increment: resources.iron || 0 },
        bauxite: { increment: resources.bauxite || 0 },
        lead: { increment: resources.lead || 0 },
        gasoline: { increment: resources.gasoline || 0 },
        munitions: { increment: resources.munitions || 0 },
        steel: { increment: resources.steel || 0 },
        aluminum: { increment: resources.aluminum || 0 },
        food: { increment: resources.food || 0 },
        totalDeposited: { increment: moneyValue }
      }
    })

    // Create transaction record
    await prisma.holdingTransaction.create({
      data: {
        holdingId: holdings.id,
        userId: session.user.id,
        type: 'deposit',
        money: resources.money || null,
        coal: resources.coal || null,
        oil: resources.oil || null,
        uranium: resources.uranium || null,
        iron: resources.iron || null,
        bauxite: resources.bauxite || null,
        lead: resources.lead || null,
        gasoline: resources.gasoline || null,
        munitions: resources.munitions || null,
        steel: resources.steel || null,
        aluminum: resources.aluminum || null,
        food: resources.food || null,
        note: note || null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HOLDINGS_DEPOSIT',
        resource: 'holdings',
        resourceId: holdings.id,
        details: {
          allianceId: parseInt(allianceId),
          resources,
          note
        }
      }
    })

    console.log('Deposit completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Resources deposited to holdings',
      transaction: {
        type: 'deposit',
        resources,
        note,
        timestamp: new Date().toISOString()
      },
      newBalances: {
        money: updatedHoldings.money,
        coal: updatedHoldings.coal,
        oil: updatedHoldings.oil,
        uranium: updatedHoldings.uranium,
        iron: updatedHoldings.iron,
        bauxite: updatedHoldings.bauxite,
        lead: updatedHoldings.lead,
        gasoline: updatedHoldings.gasoline,
        munitions: updatedHoldings.munitions,
        steel: updatedHoldings.steel,
        aluminum: updatedHoldings.aluminum,
        food: updatedHoldings.food
      }
    })

  } catch (error) {
    console.error('Holdings deposit error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
