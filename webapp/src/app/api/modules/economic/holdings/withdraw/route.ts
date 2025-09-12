import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PoliticsWarAPI } from '@/lib/politics-war-api'

// POST /api/modules/economic/holdings/withdraw - Withdraw from holdings
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

    // Validate that at least one resource is being withdrawn
    const resourceKeys = ['money', 'coal', 'oil', 'uranium', 'iron', 'bauxite', 'lead', 'gasoline', 'munitions', 'steel', 'aluminum', 'food']
    const hasResources = resourceKeys.some(key => resources[key] && resources[key] > 0)
    
    if (!hasResources) {
      return NextResponse.json({ 
        error: 'At least one resource must be withdrawn' 
      }, { status: 400 })
    }

    console.log('Processing withdrawal for user', session.user.id, 'in alliance', allianceId)

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

    // Get user's nation info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pwNationId: true }
    })

    if (!user?.pwNationId) {
      return NextResponse.json({ 
        error: 'Nation ID not found. Please link your P&W account.' 
      }, { status: 400 })
    }

    // Check if alliance has API access configured (alliance officers/leaders only)
    const allianceApiKey = await prisma.allianceApiKey.findUnique({
      where: { allianceId: parseInt(allianceId) },
      select: { apiKey: true }
    })

    if (!allianceApiKey) {
      return NextResponse.json({
        error: 'Alliance API key not configured. Bank operations require alliance-level API access. Please contact your alliance leadership.',
        requiresAllianceKey: true
      }, { status: 400 })
    }

    // Get user's holdings
    const holdings = await prisma.memberHolding.findUnique({
      where: {
        userId_allianceId: {
          userId: session.user.id,
          allianceId: parseInt(allianceId)
        }
      }
    })

    if (!holdings) {
      return NextResponse.json({ 
        error: 'No holdings found for this alliance' 
      }, { status: 404 })
    }

    // Validate sufficient balance for each resource
    const insufficientResources = []
    for (const [resource, amount] of Object.entries(resources)) {
      const numAmount = Number(amount)
      if (numAmount && numAmount > 0) {
        const currentBalance = holdings[resource as keyof typeof holdings] as number
        if (currentBalance < numAmount) {
          insufficientResources.push({
            resource,
            requested: numAmount,
            available: currentBalance
          })
        }
      }
    }

    if (insufficientResources.length > 0) {
      return NextResponse.json({
        error: 'Insufficient balance',
        details: insufficientResources
      }, { status: 400 })
    }

    // Calculate money value of withdrawal for tracking
    const moneyValue = resources.money || 0

    // Initialize P&W API client with alliance API key
    const pwApi = new PoliticsWarAPI(allianceApiKey.apiKey)

    try {
      // Make the actual withdrawal from P&W alliance bank
      const withdrawResult = await pwApi.bankWithdraw({
        receiver: user.pwNationId.toString(),
        receiver_type: 1, // 1 for nation, 2 for alliance
        money: resources.money || 0,
        coal: resources.coal || 0,
        oil: resources.oil || 0,
        uranium: resources.uranium || 0,
        iron: resources.iron || 0,
        bauxite: resources.bauxite || 0,
        lead: resources.lead || 0,
        gasoline: resources.gasoline || 0,
        munitions: resources.munitions || 0,
        steel: resources.steel || 0,
        aluminum: resources.aluminum || 0,
        food: resources.food || 0,
        note: note || `Withdrawal by ${session.user.name || 'member'} via alliance platform`
      })

      console.log('P&W Bank withdrawal successful:', withdrawResult)

      // Update holdings balances (subtract amounts)
      const updatedHoldings = await prisma.memberHolding.update({
        where: { id: holdings.id },
        data: {
          money: { decrement: resources.money || 0 },
          coal: { decrement: resources.coal || 0 },
          oil: { decrement: resources.oil || 0 },
          uranium: { decrement: resources.uranium || 0 },
          iron: { decrement: resources.iron || 0 },
          bauxite: { decrement: resources.bauxite || 0 },
          lead: { decrement: resources.lead || 0 },
          gasoline: { decrement: resources.gasoline || 0 },
          munitions: { decrement: resources.munitions || 0 },
          steel: { decrement: resources.steel || 0 },
          aluminum: { decrement: resources.aluminum || 0 },
          food: { decrement: resources.food || 0 },
          totalWithdrawn: { increment: moneyValue }
        }
      })

      // Create transaction record
      await prisma.holdingTransaction.create({
        data: {
          holdingId: holdings.id,
          userId: session.user.id,
          type: 'withdraw',
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
          note: note || null,
          pwBankRecordId: withdrawResult.bankWithdraw?.id || null
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'HOLDINGS_WITHDRAW',
          resource: 'holdings',
          resourceId: holdings.id,
          details: {
            allianceId: parseInt(allianceId),
            resources,
            note,
            pwBankRecordId: withdrawResult.bankWithdraw?.id
          }
        }
      })

      console.log('Withdrawal completed successfully')

      return NextResponse.json({
        success: true,
        message: 'Resources withdrawn from alliance bank successfully',
        transaction: {
          type: 'withdraw',
          resources,
          note,
          timestamp: new Date().toISOString(),
          pwBankRecordId: withdrawResult.bankWithdraw?.id
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

    } catch (pwError: any) {
      console.error('P&W API Error during withdrawal:', pwError)
      
      // Check if it's a rate limit error
      if (pwError.message?.includes('rate limit')) {
        return NextResponse.json({
          error: 'API rate limit reached. Please try again later.',
          details: pwError.message
        }, { status: 429 })
      }

      // Check if it's an insufficient funds error
      if (pwError.message?.includes('insufficient') || pwError.message?.includes('balance')) {
        return NextResponse.json({
          error: 'Insufficient resources in alliance bank. Please check alliance bank balances.',
          details: pwError.message
        }, { status: 400 })
      }

      // Check for authentication/bot key errors
      if (pwError.message?.includes('X-Bot-Key') || pwError.message?.includes('bot key') || pwError.message?.includes('verified bot')) {
        return NextResponse.json({
          error: 'Bank operations require a verified bot key. This feature requires special P&W API permissions that are only available to verified bots.',
          details: 'Please contact your alliance leadership to set up proper bank access permissions.',
          requiresBotKey: true
        }, { status: 403 })
      }

      // Check for permission errors
      if (pwError.message?.includes('permission') || pwError.message?.includes('authorize')) {
        return NextResponse.json({
          error: 'You do not have permission to withdraw from the alliance bank.',
          details: pwError.message
        }, { status: 403 })
      }

      // Generic P&W API error
      return NextResponse.json({
        error: 'Failed to withdraw from Politics & War alliance bank',
        details: pwError.message || 'Unknown P&W API error'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Holdings withdrawal error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
