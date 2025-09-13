import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface UserRoleInfo {
  hasRole: boolean
  roles: string[]
  permissions: {
    canAssignRoles: boolean
    canCreateQuests: boolean
    canManageMembers: boolean
    canViewWarData: boolean
    canManageEconomics: boolean
    canManageRecruitment: boolean
    modulePermissions: string[]
  }
  isAllianceAdmin: boolean
  user?: {
    id: string
    allianceId?: number
    allianceName?: string
  }
  error?: string
}

/**
 * Check if the current user has a specific role in their alliance
 */
export async function checkUserRole(roleName: string): Promise<UserRoleInfo> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return {
        hasRole: false,
        roles: [],
        permissions: {
          canAssignRoles: false,
          canCreateQuests: false,
          canManageMembers: false,
          canViewWarData: false,
          canManageEconomics: false,
          canManageRecruitment: false,
          modulePermissions: []
        },
        isAllianceAdmin: false,
        error: 'User not authenticated'
      }
    }

    if (!session.user.currentAllianceId) {
      return {
        hasRole: false,
        roles: [],
        permissions: {
          canAssignRoles: false,
          canCreateQuests: false,
          canManageMembers: false,
          canViewWarData: false,
          canManageEconomics: false,
          canManageRecruitment: false,
          modulePermissions: []
        },
        isAllianceAdmin: false,
        error: 'User not in an alliance'
      }
    }

    // Check if user is Alliance Administrator
    const allianceAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId: session.user.currentAllianceId,
        userId: session.user.id,
        isActive: true
      },
      include: {
        alliance: true
      }
    })

    // Get all user's roles in this alliance
    const userRoles = await prisma.userAllianceRole.findMany({
      where: {
        userId: session.user.id,
        allianceId: session.user.currentAllianceId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: true,
        alliance: true
      }
    })

    const roleNames = userRoles.map((ur: any) => ur.role.name)
    const hasSpecificRole = roleNames.includes(roleName)
    const isAdmin = !!allianceAdmin

    // Aggregate permissions from all roles
    const aggregatedPermissions = userRoles.reduce((acc: any, userRole: any) => {
      const role = userRole.role
      return {
        canAssignRoles: acc.canAssignRoles || role.canAssignRoles,
        canCreateQuests: acc.canCreateQuests || role.canCreateQuests,
        canManageMembers: acc.canManageMembers || role.canManageMembers,
        canViewWarData: acc.canViewWarData || role.canViewWarData,
        canManageEconomics: acc.canManageEconomics || role.canManageEconomics,
        canManageRecruitment: acc.canManageRecruitment || role.canManageRecruitment,
        modulePermissions: Array.from(new Set([...acc.modulePermissions, ...role.modulePermissions]))
      }
    }, {
      canAssignRoles: false,
      canCreateQuests: false,
      canManageMembers: false,
      canViewWarData: false,
      canManageEconomics: false,
      canManageRecruitment: false,
      modulePermissions: [] as string[]
    })

    // Alliance Admins have all permissions
    if (isAdmin) {
      aggregatedPermissions.canAssignRoles = true
      aggregatedPermissions.canCreateQuests = true
      aggregatedPermissions.canManageMembers = true
      aggregatedPermissions.canViewWarData = true
      aggregatedPermissions.canManageEconomics = true
      aggregatedPermissions.canManageRecruitment = true
    }

    return {
      hasRole: hasSpecificRole || isAdmin, // Admins have all roles
      roles: isAdmin ? [...roleNames, 'Alliance Administrator'] : roleNames,
      permissions: aggregatedPermissions,
      isAllianceAdmin: isAdmin,
      user: {
        id: session.user.id,
        allianceId: session.user.currentAllianceId,
        allianceName: allianceAdmin?.alliance?.name || userRoles[0]?.alliance?.name
      }
    }

  } catch (error) {
    console.error('Role check failed:', error)
    return {
      hasRole: false,
      roles: [],
      permissions: {
        canAssignRoles: false,
        canCreateQuests: false,
        canManageMembers: false,
        canViewWarData: false,
        canManageEconomics: false,
        canManageRecruitment: false,
        modulePermissions: []
      },
      isAllianceAdmin: false,
      error: 'Failed to check user role'
    }
  }
}

/**
 * Check if user has any role management permissions (Role Manager or Alliance Admin)
 */
export async function checkRoleManagerPermission(): Promise<UserRoleInfo> {
  const roleInfo = await checkUserRole('Role Manager')
  
  // Return success if they're an admin or have role assignment permission
  return {
    ...roleInfo,
    hasRole: roleInfo.isAllianceAdmin || roleInfo.permissions.canAssignRoles
  }
}

/**
 * Check if user has quest management permissions (Quest Manager or Alliance Admin)
 */
export async function checkQuestManagerPermission(): Promise<UserRoleInfo> {
  const roleInfo = await checkUserRole('Quest Manager')
  
  // Return success if they're an admin or have quest creation permission
  return {
    ...roleInfo,
    hasRole: roleInfo.isAllianceAdmin || roleInfo.permissions.canCreateQuests
  }
}

/**
 * Check if user is Alliance Administrator for a specific alliance
 */
export async function checkAllianceAdminPermission(allianceId: number): Promise<{
  hasPermission: boolean
  adminLevel: 'none' | 'admin' | 'owner'
  reason?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return {
        hasPermission: false,
        adminLevel: 'none',
        reason: 'User not authenticated'
      }
    }

    const allianceAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId: allianceId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!allianceAdmin) {
      return {
        hasPermission: false,
        adminLevel: 'none',
        reason: 'User is not an administrator for this alliance'
      }
    }

    return {
      hasPermission: true,
      adminLevel: allianceAdmin.role === 'owner' ? 'owner' : 'admin'
    }

  } catch (error) {
    console.error('Alliance admin check failed:', error)
    return {
      hasPermission: false,
      adminLevel: 'none',
      reason: 'Failed to check admin permission'
    }
  }
}

/**
 * Get all roles for the current user in their alliance
 */
export async function getCurrentUserRoles(): Promise<UserRoleInfo> {
  return await checkUserRole('') // Empty string will return all role info
}

/**
 * Middleware wrapper for API routes that require specific role permissions
 */
export async function requireRole(roleName: string) {
  const roleInfo = await checkUserRole(roleName)
  
  if (!roleInfo.hasRole) {
    throw new Error(roleInfo.error || `Access denied: ${roleName} role required`)
  }
  
  return roleInfo
}

/**
 * Middleware wrapper for API routes that require Alliance Administrator access
 */
export async function requireAllianceAdmin(allianceId: number) {
  const adminCheck = await checkAllianceAdminPermission(allianceId)
  
  if (!adminCheck.hasPermission) {
    throw new Error(adminCheck.reason || 'Alliance Administrator access required')
  }
  
  return adminCheck
}