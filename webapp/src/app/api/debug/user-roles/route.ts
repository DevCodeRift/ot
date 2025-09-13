import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'Not authenticated' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        allianceAdminRoles: {
          include: {
            alliance: true
          }
        },
        allianceRoles: {
          include: {
            role: true
          }
        }
      }
    })

    // Check alliance admin status
    const allianceAdmins = user?.allianceAdminRoles || []
    
    // Check roles in current alliance
    const currentAllianceRoles = user?.allianceRoles?.filter(ur => 
      ur.role.allianceId === session.user.currentAllianceId
    ) || []

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user?.id,
        discordId: user?.discordId,
        discordUsername: user?.discordUsername,
        currentAllianceId: session.user.currentAllianceId
      },
      allianceAdmins: allianceAdmins.map(admin => ({
        allianceId: admin.allianceId,
        allianceName: admin.alliance.name,
        role: admin.role,
        isActive: admin.isActive
      })),
      currentAllianceRoles: currentAllianceRoles.map(ur => ({
        roleId: ur.role.id,
        roleName: ur.role.name,
        permissions: {
          canAssignRoles: ur.role.canAssignRoles,
          canManageMembers: ur.role.canManageMembers,
          canCreateQuests: ur.role.canCreateQuests,
          canViewWarData: ur.role.canViewWarData,
          canManageEconomics: ur.role.canManageEconomics,
          canManageRecruitment: ur.role.canManageRecruitment
        }
      })),
      permissions: {
        isAllianceAdmin: allianceAdmins.some(admin => 
          admin.allianceId === session.user.currentAllianceId && admin.isActive
        ),
        canAssignRoles: allianceAdmins.some(admin => 
          admin.allianceId === session.user.currentAllianceId && admin.isActive
        ) || currentAllianceRoles.some(ur => ur.role.canAssignRoles),
        hasAnyRoles: currentAllianceRoles.length > 0
      }
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}