import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PoliticsWarAPI } from '@/lib/politics-war-api'

// POST /api/modules/economic/holdings/deposit - Deposit to holdings
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

    // Initialize P&W API client with alliance API key for bank operations
    const pwApi = new PoliticsWarAPI(allianceApiKey.apiKey)

    try {
      // Make the actual deposit to P&W alliance bank
      const depositResult = await pwApi.bankDeposit({
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
        note: note || `Deposit from ${session.user.name || 'member'} via alliance platform`
      })

      console.log('P&W Bank deposit successful:', depositResult)

      // Get or create user's holdings record for tracking
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

      // Update holdings balances (add amounts for tracking)
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
          note: note || null,
          pwBankRecordId: depositResult.bankDeposit?.id || null
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
            note,
            pwBankRecordId: depositResult.bankDeposit?.id
          }
        }
      })

      console.log('Deposit completed successfully')

      return NextResponse.json({
        success: true,
        message: 'Resources deposited to alliance bank successfully',
        transaction: {
          type: 'deposit',
          resources,
          note,
          timestamp: new Date().toISOString(),
          pwBankRecordId: depositResult.bankDeposit?.id
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
      console.error('P&W API Error during deposit:', pwError)
      
      // Check for authentication/bot key errors
      if (pwError.message?.includes('X-Bot-Key') || pwError.message?.includes('bot key') || pwError.message?.includes('verified bot')) {
        return NextResponse.json({
          error: 'Bank operations require a verified bot key. This feature requires special P&W API permissions that are only available to verified bots.',
          details: 'Please contact your alliance leadership to set up proper bank access permissions.',
          requiresBotKey: true
        }, { status: 403 })
      }

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
          error: 'Insufficient resources in your nation. Please check your resource balances.',
          details: pwError.message
        }, { status: 400 })
      }

      // Check for permission errors
      if (pwError.message?.includes('permission') || pwError.message?.includes('authorize')) {
        return NextResponse.json({
          error: 'You do not have permission to deposit to the alliance bank.',
          details: pwError.message
        }, { status: 403 })
      }

      // Generic P&W API error
      return NextResponse.json({
        error: 'Failed to deposit to Politics & War alliance bank',
        details: pwError.message || 'Unknown P&W API error'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Holdings deposit error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
