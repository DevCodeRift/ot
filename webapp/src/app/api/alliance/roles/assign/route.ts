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
        error: 'Role not found or not available in this alliance' 
      }, { status: 404 })
    }

    // Verify the target user exists and is in the same alliance
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        currentAllianceId: session.user.currentAllianceId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found or not in the same alliance' 
      }, { status: 404 })
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userAllianceRole.findFirst({
      where: {
        userId: validatedData.userId,
        allianceId: session.user.currentAllianceId,
        roleId: validatedData.roleId,
        isActive: true
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'User already has this role' 
      }, { status: 400 })
    }

    // Create role assignment
    const assignment = await prisma.userAllianceRole.create({
      data: {
        userId: validatedData.userId,
        allianceId: session.user.currentAllianceId,
        roleId: validatedData.roleId,
        assignedBy: session.user.id,
        expiresAt: validatedData.expiresAt
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
            description: true,
            color: true
          }
        }
      }
    })

    // Log the action
    await prisma.roleAuditLog.create({
      data: {
        allianceId: session.user.currentAllianceId,
        actionType: 'role_assigned',
        performedBy: session.user.id,
        targetUserId: validatedData.userId,
        roleId: validatedData.roleId,
        roleName: role.name
      }
    })

    console.log(`🔧 ${session.user.discordUsername || session.user.id} assigned role "${role.name}" to user ${targetUser.pwNationName || targetUser.name}`)

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        user: assignment.user,
        role: assignment.role,
        assignedAt: assignment.assignedAt,
        expiresAt: assignment.expiresAt
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

// DELETE /api/alliance/roles/assign - Revoke role from user
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const roleId = searchParams.get('roleId')

    if (!userId || !roleId) {
      return NextResponse.json({ 
        error: 'userId and roleId are required' 
      }, { status: 400 })
    }

    // Find the assignment
    const assignment = await prisma.userAllianceRole.findFirst({
      where: {
        userId,
        allianceId: session.user.currentAllianceId,
        roleId,
        isActive: true
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            discordUsername: true,
            pwNationName: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Role assignment not found' 
      }, { status: 404 })
    }

    // Deactivate the assignment
    const updatedAssignment = await prisma.userAllianceRole.update({
      where: { id: assignment.id },
      data: { isActive: false }
    })

    // Log the action
    await prisma.roleAuditLog.create({
      data: {
        allianceId: session.user.currentAllianceId,
        actionType: 'role_revoked',
        performedBy: session.user.id,
        targetUserId: userId,
        roleId: roleId,
        roleName: assignment.role.name
      }
    })

    console.log(`🔧 ${session.user.discordUsername || session.user.id} revoked role "${assignment.role.name}" from user ${assignment.user.pwNationName || assignment.user.name}`)

    return NextResponse.json({
      success: true,
      message: `Role "${assignment.role.name}" revoked from user`
    })

  } catch (error) {
    console.error('Revoke role error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}