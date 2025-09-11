import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface ModuleAccessResult {
  hasAccess: boolean
  user?: {
    id: string
    allianceId?: number
    allianceName?: string
  }
  error?: string
}

/**
 * Check if the current user has access to a specific module
 * @param moduleId - The ID of the module to check access for
 * @returns ModuleAccessResult indicating if user has access
 */
export async function checkModuleAccess(moduleId: string): Promise<ModuleAccessResult> {
  try {
    // Get current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return {
        hasAccess: false,
        error: 'User not authenticated'
      }
    }

    // Get user's current alliance
    if (!session.user.currentAllianceId) {
      return {
        hasAccess: false,
        error: 'User not in an alliance'
      }
    }

    // Check if the module exists and is active
    const module = await prisma.module.findUnique({
      where: { id: moduleId, isActive: true }
    })

    if (!module) {
      return {
        hasAccess: false,
        error: 'Module not found or inactive'
      }
    }

    // Check if the user's alliance has access to this module
    const allianceModule = await prisma.allianceModule.findUnique({
      where: {
        allianceId_moduleId: {
          allianceId: session.user.currentAllianceId,
          moduleId: moduleId
        }
      },
      include: {
        alliance: true
      }
    })

    if (!allianceModule || !allianceModule.enabled) {
      return {
        hasAccess: false,
        user: {
          id: session.user.id,
          allianceId: session.user.currentAllianceId,
          allianceName: session.user.pwNationName ? `Alliance ${session.user.currentAllianceId}` : undefined
        },
        error: `Your alliance does not have access to the ${module.name} module`
      }
    }

    return {
      hasAccess: true,
      user: {
        id: session.user.id,
        allianceId: session.user.currentAllianceId,
        allianceName: allianceModule.alliance.name
      }
    }

  } catch (error) {
    console.error('Module access check failed:', error)
    return {
      hasAccess: false,
      error: 'Failed to check module access'
    }
  }
}

/**
 * Get all modules that the current user's alliance has access to
 */
export async function getUserAvailableModules(): Promise<{
  modules: Array<{
    id: string
    name: string
    description: string
    category: string
  }>
  user?: {
    id: string
    allianceId?: number
    allianceName?: string
  }
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return {
        modules: [],
        error: 'User not authenticated'
      }
    }

    if (!session.user.currentAllianceId) {
      return {
        modules: [],
        error: 'User not in an alliance'
      }
    }

    // Get all modules that the user's alliance has access to
    const allianceModules = await prisma.allianceModule.findMany({
      where: {
        allianceId: session.user.currentAllianceId,
        enabled: true,
        module: {
          isActive: true
        }
      },
      include: {
        module: true,
        alliance: true
      }
    })

    return {
      modules: allianceModules.map((am) => ({
        id: am.module.id,
        name: am.module.name,
        description: am.module.description || '',
        category: am.module.category || 'general'
      })),
      user: {
        id: session.user.id,
        allianceId: session.user.currentAllianceId,
        allianceName: allianceModules[0]?.alliance?.name
      }
    }

  } catch (error) {
    console.error('Failed to get user available modules:', error)
    return {
      modules: [],
      error: 'Failed to load available modules'
    }
  }
}

/**
 * Middleware wrapper for API routes that require module access
 * Usage: const access = await requireModuleAccess('membership')
 */
export async function requireModuleAccess(moduleId: string) {
  const access = await checkModuleAccess(moduleId)
  
  if (!access.hasAccess) {
    throw new Error(access.error || 'Access denied')
  }
  
  return access
}
