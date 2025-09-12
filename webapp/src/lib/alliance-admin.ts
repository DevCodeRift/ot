import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

const prisma = new PrismaClient()

// Enhanced admin permission checker that handles multiple scenarios
export async function checkAllianceAdminPermission(allianceId: number, session: any): Promise<{
  hasPermission: boolean
  reason: string
  adminLevel: 'none' | 'member' | 'admin' | 'owner' | 'global'
}> {
  try {
    if (!session?.user?.id) {
      return { hasPermission: false, reason: 'No session', adminLevel: 'none' }
    }

    // Check global admin first (from environment)
    const ADMIN_DISCORD_IDS = process.env.ADMIN_DISCORD_IDS?.split(',') || []
    if (session.user.discordId && ADMIN_DISCORD_IDS.includes(session.user.discordId)) {
      return { hasPermission: true, reason: 'Global admin', adminLevel: 'global' }
    }

    // Method 1: Check direct AllianceAdmin table
    const directAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (directAdmin) {
      const level = directAdmin.role === 'owner' ? 'owner' : 'admin'
      return { 
        hasPermission: true, 
        reason: `Direct admin (${directAdmin.role})`, 
        adminLevel: level
      }
    }

    // Method 2: Check if user's Discord ID matches any admin Discord ID for this alliance
    if (session.user.discordId) {
      const discordAdmin = await prisma.allianceAdmin.findFirst({
        where: {
          allianceId,
          discordId: session.user.discordId,
          isActive: true
        }
      })

      if (discordAdmin) {
        // Auto-link the admin record to the user if not linked
        if (!discordAdmin.userId || discordAdmin.userId !== session.user.id) {
          await prisma.allianceAdmin.update({
            where: { id: discordAdmin.id },
            data: { userId: session.user.id }
          })
          console.log(`Auto-linked admin record for Discord ID ${session.user.discordId} to user ${session.user.id}`)
        }

        const level = discordAdmin.role === 'owner' ? 'owner' : 'admin'
        return { 
          hasPermission: true, 
          reason: `Discord admin (${discordAdmin.role})`, 
          adminLevel: level
        }
      }
    }

    // Method 3: Check if user is a member of the alliance with special permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        nation: {
          include: {
            alliance: true
          }
        }
      }
    })

    if (user?.currentAllianceId === allianceId || user?.nation?.allianceId === allianceId) {
      // User is a member, grant basic permissions
      return { hasPermission: true, reason: 'Alliance member', adminLevel: 'member' }
    }

    return { hasPermission: false, reason: 'No admin permissions found', adminLevel: 'none' }

  } catch (error) {
    console.error('Error checking alliance admin permission:', error)
    return { hasPermission: false, reason: 'Permission check error', adminLevel: 'none' }
  }
}

// Simplified function for quest management specifically
export async function checkQuestManagementPermission(allianceId: number): Promise<{
  hasAccess: boolean
  user: any
  adminLevel: string
  reason: string
}> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { 
        hasAccess: false, 
        user: null, 
        adminLevel: 'none',
        reason: 'Not authenticated' 
      }
    }

    const permission = await checkAllianceAdminPermission(allianceId, session)
    
    // Quest management requires at least member level
    const hasAccess = permission.adminLevel !== 'none'

    return {
      hasAccess,
      user: session.user,
      adminLevel: permission.adminLevel,
      reason: permission.reason
    }

  } catch (error) {
    console.error('Quest management permission check error:', error)
    return { 
      hasAccess: false, 
      user: null, 
      adminLevel: 'none',
      reason: 'Permission check failed' 
    }
  }
}