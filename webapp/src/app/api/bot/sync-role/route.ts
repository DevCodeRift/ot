import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { identifyUser, createPlaceholderUser } from '@/lib/user-identification'
import { z } from 'zod'

// Schema for role sync from Discord
const discordRoleSyncSchema = z.object({
  discordServerId: z.string(),
  discordUserId: z.string(),
  discordRoleId: z.string(),
  action: z.enum(['assign', 'remove']),
  botSecret: z.string(),
  // Optional additional identification data
  discordUsername: z.string().optional(),
  nationName: z.string().optional(),
  nationId: z.number().optional()
})

// POST /api/bot/sync-role - Sync role assignment from Discord to website
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = discordRoleSyncSchema.parse(body)

    // Verify bot authentication
    if (validatedData.botSecret !== process.env.WEBAPP_BOT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized bot request' }, { status: 401 })
    }

    // Find the alliance role by Discord role ID
    const allianceRole = await prisma.allianceRole.findFirst({
      where: { 
        discordRoleId: validatedData.discordRoleId,
        isActive: true
      },
      include: {
        alliance: true
      }
    })

    if (!allianceRole) {
      return NextResponse.json({ 
        error: 'Alliance role not found for Discord role ID',
        discordRoleId: validatedData.discordRoleId
      }, { status: 404 })
    }

    // Find user using enhanced identification system
    const userIdentification = await identifyUser({
      discordUserId: validatedData.discordUserId,
      discordUsername: validatedData.discordUsername,
      nationName: validatedData.nationName,
      nationId: validatedData.nationId,
      allianceId: allianceRole.allianceId
    })

    let user = userIdentification.user

    // If user not found but we can create a placeholder
    if (!userIdentification.found && userIdentification.canCreateUser) {
      try {
        user = await createPlaceholderUser({
          discordUserId: validatedData.discordUserId,
          discordUsername: validatedData.discordUsername,
          nationId: validatedData.nationId,
          nationName: validatedData.nationName,
          allianceId: allianceRole.allianceId
        })
        console.log(`Created placeholder user for Discord role sync: ${user.discordUsername}`)
      } catch (createError) {
        console.error('Failed to create placeholder user:', createError)
        return NextResponse.json({ 
          error: 'User not found and failed to create placeholder user',
          discordUserId: validatedData.discordUserId,
          suggestions: userIdentification.suggestions
        }, { status: 404 })
      }
    }

    // If still no user found
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found and cannot create placeholder user',
        discordUserId: validatedData.discordUserId,
        suggestions: userIdentification.suggestions,
        canCreateUser: userIdentification.canCreateUser
      }, { status: 404 })
    }

    // Verify user belongs to the same alliance (or assign them if placeholder)
    if (user.currentAllianceId && user.currentAllianceId !== allianceRole.allianceId) {
      return NextResponse.json({ 
        error: 'User does not belong to the role\'s alliance',
        userAllianceId: user.currentAllianceId,
        roleAllianceId: allianceRole.allianceId,
        identifiedBy: userIdentification.identifiedBy
      }, { status: 403 })
    }

    // If user doesn't have alliance set and this is a placeholder, update it
    if (!user.currentAllianceId && allianceRole.allianceId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentAllianceId: allianceRole.allianceId }
      })
      user.currentAllianceId = allianceRole.allianceId
      console.log(`Updated placeholder user alliance: ${user.discordUsername} -> Alliance ${allianceRole.allianceId}`)
    }

    if (validatedData.action === 'assign') {
      // Check if assignment already exists
      const existing = await prisma.userAllianceRole.findFirst({
        where: {
          userId: user.id,
          roleId: allianceRole.id,
          allianceId: allianceRole.allianceId,
          isActive: true
        }
      })

      if (!existing) {
        // Create role assignment
        const assignment = await prisma.userAllianceRole.create({
          data: {
            userId: user.id,
            roleId: allianceRole.id,
            allianceId: allianceRole.allianceId,
            assignedBy: 'DISCORD_SYNC',
            assignedAt: new Date(),
            isActive: true
          }
        })

        console.log(`Synced role assignment from Discord: ${user.discordUsername || user.name} -> ${allianceRole.name} (identified by: ${userIdentification.identifiedBy})`)
        
        return NextResponse.json({
          success: true,
          message: 'Role assigned successfully',
          identifiedBy: userIdentification.identifiedBy,
          isPlaceholderUser: !user.emailVerified,
          assignment: {
            id: assignment.id,
            userId: assignment.userId,
            roleId: assignment.roleId,
            allianceId: assignment.allianceId
          }
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'Role assignment already exists'
        })
      }
    } else {
      // Remove role assignment
      const updated = await prisma.userAllianceRole.updateMany({
        where: {
          userId: user.id,
          roleId: allianceRole.id,
          allianceId: allianceRole.allianceId,
          isActive: true
        },
        data: { isActive: false }
      })

      console.log(`Synced role removal from Discord: ${user.discordUsername || user.name} -> ${allianceRole.name} (identified by: ${userIdentification.identifiedBy})`)
      
      return NextResponse.json({
        success: true,
        message: 'Role removed successfully',
        identifiedBy: userIdentification.identifiedBy,
        isPlaceholderUser: !user.emailVerified,
        removedCount: updated.count
      })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Error syncing role from Discord:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}