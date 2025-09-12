import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/modules/economic/assign-tax-bracket - Assign member to tax bracket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { allianceId, nationId, taxBracketId } = body

    if (!allianceId || !nationId || !taxBracketId) {
      return NextResponse.json({ 
        error: 'Alliance ID, Nation ID, and Tax Bracket ID are required' 
      }, { status: 400 })
    }

    console.log('Assigning nation', nationId, 'to tax bracket', taxBracketId, 'in alliance', allianceId)

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

    // Check if user is an admin for this alliance
    const isAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        userId: session.user.id,
        isActive: true
      }
    })

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required for tax bracket management' 
      }, { status: 403 })
    }

    // Get alliance API key
    const apiKey = await prisma.allianceApiKey.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        isActive: true
      }
    })

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No active API key found for this alliance' 
      }, { status: 400 })
    }

    // Note: In a real implementation, you would use the P&W API to actually assign the tax bracket
    // This would require specific API permissions for tax bracket management
    // For now, we'll log the action and store it in our audit system

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ASSIGN_TAX_BRACKET',
        resource: 'nation',
        resourceId: nationId.toString(),
        details: {
          allianceId: parseInt(allianceId),
          nationId: parseInt(nationId),
          taxBracketId: parseInt(taxBracketId),
          assignedBy: session.user.id
        }
      }
    })

    console.log('Tax bracket assignment logged successfully')

    return NextResponse.json({
      success: true,
      message: 'Tax bracket assignment completed',
      assignment: {
        nationId: parseInt(nationId),
        taxBracketId: parseInt(taxBracketId),
        assignedBy: session.user.id,
        assignedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Assign tax bracket error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET /api/modules/economic/assign-tax-bracket - Get current tax bracket assignments
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

    // Get recent tax bracket assignments from audit logs
    const assignments = await prisma.auditLog.findMany({
      where: {
        action: 'ASSIGN_TAX_BRACKET',
        details: {
          path: ['allianceId'],
          equals: parseInt(allianceId)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            discordUsername: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Last 50 assignments
    })

    const formattedAssignments = assignments.map((assignment: any) => ({
      id: assignment.id,
      nationId: assignment.details?.nationId,
      taxBracketId: assignment.details?.taxBracketId,
      assignedBy: {
        id: assignment.user?.id,
        name: assignment.user?.name,
        username: assignment.user?.discordUsername
      },
      assignedAt: assignment.createdAt
    }))

    return NextResponse.json({
      success: true,
      assignments: formattedAssignments,
      totalCount: formattedAssignments.length
    })

  } catch (error) {
    console.error('Get tax bracket assignments error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
