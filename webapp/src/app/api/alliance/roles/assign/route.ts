import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRoleManagerPermission } from '@/lib/role-permissions'
import { z } from 'zod'

// Schema for role assignment
const assignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined)
})

// POST /api/alliance/roles/assign - Assign role to user with upsert logic
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get alliance ID from query parameter or user's current alliance
    const { searchParams } = new URL(request.url)
    const queryAllianceId = searchParams.get('allianceId')
    
    let allianceId: number
    if (queryAllianceId) {
      allianceId = parseInt(queryAllianceId)
      if (isNaN(allianceId)) {
        return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
      }
    } else if (session.user.currentAllianceId) {
      allianceId = session.user.currentAllianceId
    } else {
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
        allianceId: allianceId,
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
        currentAllianceId: allianceId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found or does not belong to your alliance' 
      }, { status: 404 })
    }

    // Use upsert to handle the unique constraint properly
    const assignment = await prisma.userAllianceRole.upsert({
      where: {
        // Use the compound unique key
        userId_allianceId_roleId: {
          userId: validatedData.userId,
          allianceId: allianceId,
          roleId: validatedData.roleId
        }
      },
      update: {
        // Update existing assignment to be active
        assignedBy: session.user.id,
        assignedAt: new Date(),
        expiresAt: validatedData.expiresAt || null,
        isActive: true
      },
      create: {
        // Create new assignment
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        allianceId: allianceId,
        assignedBy: session.user.id,
        assignedAt: new Date(),
        expiresAt: validatedData.expiresAt || null,
        isActive: true
      }
    })

    // Sync with Discord (if Discord integration is enabled)
    try {
      // Get the target user's Discord ID for sync
      const roleAny = role as any
      if (targetUser.discordId && roleAny.discordRoleId) {
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bot/discord-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
          },
          body: JSON.stringify({
            action: 'assign',
            userId: targetUser.discordId,
            roleId: roleAny.discordRoleId,
            roleName: role.name,
            allianceId: allianceId
          })
        })

        // Log Discord sync result (don't fail the main operation if Discord sync fails)
        if (!syncResponse.ok) {
          console.warn('Discord sync failed for role assignment:', await syncResponse.text())
        }
      }
    } catch (discordError) {
      console.warn('Discord sync error:', discordError)
      // Continue - Discord sync failure shouldn't prevent role assignment
    }

    // Get the assignment with user and role details for response
    const assignmentWithDetails = await prisma.userAllianceRole.findUnique({
      where: { id: assignment.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            discordUsername: true,
            pwNationName: true,
            discordId: true
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
        user: assignmentWithDetails?.user,
        role: assignmentWithDetails?.role
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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get alliance ID from query parameter or user's current alliance
    const { searchParams } = new URL(request.url)
    const queryAllianceId = searchParams.get('allianceId')
    
    let allianceId: number
    if (queryAllianceId) {
      allianceId = parseInt(queryAllianceId)
      if (isNaN(allianceId)) {
        return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
      }
    } else if (session.user.currentAllianceId) {
      allianceId = session.user.currentAllianceId
    } else {
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

    // Get the role and user details for Discord sync
    const role = await prisma.allianceRole.findFirst({
      where: {
        id: validatedData.roleId,
        allianceId: allianceId,
        isActive: true
      }
    })

    const targetUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        currentAllianceId: allianceId
      }
    })

    // Find and deactivate the role assignment
    const updated = await prisma.userAllianceRole.updateMany({
      where: {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        allianceId: allianceId,
        isActive: true
      },
      data: { 
        isActive: false 
      }
    })

    if (updated.count === 0) {
      return NextResponse.json({ 
        error: 'No active role assignment found to remove' 
      }, { status: 404 })
    }

    // Sync with Discord (if Discord integration is enabled)
    try {
      // Get the target user's Discord ID for sync
      const roleAny = role as any
      if (targetUser?.discordId && roleAny?.discordRoleId && role?.name) {
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bot/discord-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
          },
          body: JSON.stringify({
            action: 'remove',
            userId: targetUser.discordId,
            roleId: roleAny.discordRoleId,
            roleName: role.name,
            allianceId: allianceId
          })
        })

        // Log Discord sync result (don't fail the main operation if Discord sync fails)
        if (!syncResponse.ok) {
          console.warn('Discord sync failed for role removal:', await syncResponse.text())
        }
      }
    } catch (discordError) {
      console.warn('Discord sync error:', discordError)
      // Continue - Discord sync failure shouldn't prevent role removal
    }

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully',
      removedCount: updated.count
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Remove role error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}