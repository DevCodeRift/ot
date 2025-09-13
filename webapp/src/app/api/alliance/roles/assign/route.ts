import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRoleManagerPermission, checkAllianceAdminPermission } from '@/lib/role-permissions'
import { z } from 'zod'

// Schema for role assignment
const assignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined)
})

// POST /api/alliance/roles/assign - Assign role to user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.currentAllianceId) {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    // Check if user has role assignment permissions
    const roleCheck = await checkRoleManagerPermission()
    
    if (!roleCheck.hasRole) {
      return NextResponse.json({ 
        error: 'Role Manager permissions or Alliance Administrator access required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = assignRoleSchema.parse(body)

    // Verify the role exists and belongs to this alliance
    const role = await prisma.allianceRole.findFirst({
      where: {
        id: validatedData.roleId,
        allianceId: session.user.currentAllianceId,
        isActive: true
      }
    })

    if (!role) {
      return NextResponse.json({ 
        error: 'Role not found or does not belong to your alliance' 
      }, { status: 404 })
    }

    // Verify the user exists and belongs to this alliance
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        currentAllianceId: session.user.currentAllianceId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found or does not belong to your alliance' 
      }, { status: 404 })
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userAllianceRole.findFirst({
      where: {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        allianceId: session.user.currentAllianceId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'User already has this role assigned' 
      }, { status: 400 })
    }

    // Create the role assignment
    const assignment = await prisma.userAllianceRole.create({
      data: {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        allianceId: session.user.currentAllianceId,
        assignedBy: session.user.id,
        assignedAt: new Date(),
        expiresAt: validatedData.expiresAt || null,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            discordUsername: true,
            pwNationName: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
      assignment: {
        id: assignment.id,
        userId: assignment.userId,
        roleId: assignment.roleId,
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.assignedAt,
        expiresAt: assignment.expiresAt,
        user: assignment.user,
        role: assignment.role
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Assign role error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE /api/alliance/roles/assign - Remove role from user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.currentAllianceId) {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    // Check permissions
    const roleCheck = await checkRoleManagerPermission()
    
    if (!roleCheck.hasRole) {
      return NextResponse.json({ 
        error: 'Role Manager permissions or Alliance Administrator access required' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const roleId = searchParams.get('roleId')

    if (!userId || !roleId) {
      return NextResponse.json({ 
        error: 'User ID and Role ID are required' 
      }, { status: 400 })
    }

    // Find the active role assignment
    const assignment = await prisma.userAllianceRole.findFirst({
      where: {
        userId: userId,
        roleId: roleId,
        allianceId: session.user.currentAllianceId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            discordUsername: true,
            pwNationName: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Role assignment not found or already inactive' 
      }, { status: 404 })
    }

    // Deactivate the role assignment
    await prisma.userAllianceRole.update({
      where: {
        id: assignment.id
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({
      success: true,
      message: `Role "${assignment.role.name}" removed from user "${assignment.user.name || assignment.user.discordUsername || assignment.user.pwNationName || 'Unknown'}" successfully`,
      removedAssignment: {
        id: assignment.id,
        userId: assignment.userId,
        roleId: assignment.roleId,
        user: assignment.user,
        role: assignment.role
      }
    })

  } catch (error) {
    console.error('Remove role error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}