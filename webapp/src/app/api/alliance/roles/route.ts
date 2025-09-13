import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAllianceAdminPermission } from '@/lib/role-permissions'
import { z } from 'zod'

// Schema for creating/updating roles
const roleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().optional(),
  modulePermissions: z.array(z.string()).default([]),
  canAssignRoles: z.boolean().default(false),
  canCreateQuests: z.boolean().default(false),
  canManageMembers: z.boolean().default(false),
  canViewWarData: z.boolean().default(false),
  canManageEconomics: z.boolean().default(false),
  canManageRecruitment: z.boolean().default(false),
  displayOrder: z.number().default(0)
})

// GET /api/alliance/roles - Get all roles for alliance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.currentAllianceId) {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    // Check if user is alliance admin
    const adminCheck = await checkAllianceAdminPermission(session.user.currentAllianceId)
    
    if (!adminCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Alliance Administrator access required' 
      }, { status: 403 })
    }

    // Get all roles for this alliance
    const roles = await prisma.allianceRole.findMany({
      where: {
        allianceId: session.user.currentAllianceId,
        isActive: true
      },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                discordUsername: true,
                pwNationName: true
              }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json({
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        color: role.color,
        modulePermissions: role.modulePermissions,
        permissions: {
          canAssignRoles: role.canAssignRoles,
          canCreateQuests: role.canCreateQuests,
          canManageMembers: role.canManageMembers,
          canViewWarData: role.canViewWarData,
          canManageEconomics: role.canManageEconomics,
          canManageRecruitment: role.canManageRecruitment
        },
        displayOrder: role.displayOrder,
        assignedUsers: role.userRoles.map(ur => ({
          id: ur.user.id,
          name: ur.user.name,
          discordUsername: ur.user.discordUsername,
          pwNationName: ur.user.pwNationName,
          assignedAt: ur.assignedAt
        })),
        createdAt: role.createdAt
      }))
    })

  } catch (error) {
    console.error('Get alliance roles error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/alliance/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.currentAllianceId) {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    // Check if user is alliance admin
    const adminCheck = await checkAllianceAdminPermission(session.user.currentAllianceId)
    
    if (!adminCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Alliance Administrator access required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = roleSchema.parse(body)

    // Check if role name already exists in this alliance
    const existingRole = await prisma.allianceRole.findFirst({
      where: {
        allianceId: session.user.currentAllianceId,
        name: validatedData.name,
        isActive: true
      }
    })

    if (existingRole) {
      return NextResponse.json({ 
        error: 'Role name already exists in this alliance' 
      }, { status: 400 })
    }

    // Create the role
    const newRole = await prisma.allianceRole.create({
      data: {
        allianceId: session.user.currentAllianceId,
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        modulePermissions: validatedData.modulePermissions,
        canAssignRoles: validatedData.canAssignRoles,
        canCreateQuests: validatedData.canCreateQuests,
        canManageMembers: validatedData.canManageMembers,
        canViewWarData: validatedData.canViewWarData,
        canManageEconomics: validatedData.canManageEconomics,
        canManageRecruitment: validatedData.canManageRecruitment,
        displayOrder: validatedData.displayOrder,
        createdBy: session.user.id
      }
    })

    // Log the action
    await prisma.roleAuditLog.create({
      data: {
        allianceId: session.user.currentAllianceId,
        actionType: 'role_created',
        performedBy: session.user.id,
        roleId: newRole.id,
        roleName: newRole.name,
        newPermissions: {
          modulePermissions: validatedData.modulePermissions,
          canAssignRoles: validatedData.canAssignRoles,
          canCreateQuests: validatedData.canCreateQuests,
          canManageMembers: validatedData.canManageMembers,
          canViewWarData: validatedData.canViewWarData,
          canManageEconomics: validatedData.canManageEconomics,
          canManageRecruitment: validatedData.canManageRecruitment
        }
      }
    })

    console.log(`🔧 Admin ${session.user.discordUsername || session.user.id} created role "${newRole.name}" for alliance ${session.user.currentAllianceId}`)

    return NextResponse.json({
      success: true,
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        color: newRole.color,
        modulePermissions: newRole.modulePermissions,
        permissions: {
          canAssignRoles: newRole.canAssignRoles,
          canCreateQuests: newRole.canCreateQuests,
          canManageMembers: newRole.canManageMembers,
          canViewWarData: newRole.canViewWarData,
          canManageEconomics: newRole.canManageEconomics,
          canManageRecruitment: newRole.canManageRecruitment
        },
        displayOrder: newRole.displayOrder,
        assignedUsers: [],
        createdAt: newRole.createdAt
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Create role error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}