import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAllianceAdminPermission } from '@/lib/alliance-admin'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get alliance ID from request body
    const body = await request.json()
    const { allianceId } = body
    
    if (!allianceId || isNaN(parseInt(allianceId))) {
      return NextResponse.json({ error: 'Valid alliance ID required' }, { status: 400 })
    }

    const numericAllianceId = parseInt(allianceId)

    // Check if user is alliance admin for the specified alliance
    const adminCheck = await checkAllianceAdminPermission(numericAllianceId, session)
    
    if (!adminCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Alliance Administrator access required' 
      }, { status: 403 })
    }

    // Find existing roles without Discord role IDs using raw query
    const unsyncedRoles = await prisma.$queryRaw`
      SELECT id, name, description, color, "allianceId"
      FROM alliance_roles 
      WHERE "allianceId" = ${numericAllianceId} 
        AND "isActive" = true 
        AND ("discordRoleId" IS NULL OR "discordRoleId" = '')
    ` as Array<{
      id: string
      name: string
      description: string | null
      color: string | null
      allianceId: number
    }>

    console.log(`Found ${unsyncedRoles.length} unsynced roles for alliance ${numericAllianceId}`)

    const results = []
    let successCount = 0
    let errorCount = 0

    // Sync each unsynced role
    for (const role of unsyncedRoles) {
      try {
        console.log(`Syncing role: ${role.name} (${role.id})`)
        
        // Call Discord bot to create role
        const discordCreateResult = await fetch(`${process.env.NEXTAUTH_URL}/api/bot/create-discord-role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
          },
          body: JSON.stringify({
            allianceId: role.allianceId,
            roleId: role.id,
            roleName: role.name,
            roleDescription: role.description,
            roleColor: role.color
          })
        })

        if (discordCreateResult.ok) {
          const discordResult = await discordCreateResult.json()
          const discordRoleId = discordResult.discordRoleId
          
          // Update the alliance role with the Discord role ID using raw query
          await prisma.$executeRaw`
            UPDATE alliance_roles 
            SET "discordRoleId" = ${discordRoleId}
            WHERE id = ${role.id}
          `
          
          console.log(`Successfully synced role: ${role.name} (Discord ID: ${discordRoleId})`)
          
          results.push({
            roleId: role.id,
            roleName: role.name,
            status: 'success',
            discordRoleId: discordRoleId
          })
          successCount++
          
        } else {
          const errorText = await discordCreateResult.text()
          console.error(`Failed to sync role ${role.name}:`, errorText)
          
          results.push({
            roleId: role.id,
            roleName: role.name,
            status: 'error',
            error: errorText
          })
          errorCount++
        }

      } catch (roleError) {
        console.error(`Error syncing role ${role.name}:`, roleError)
        
        results.push({
          roleId: role.id,
          roleName: role.name,
          status: 'error',
          error: roleError instanceof Error ? roleError.message : 'Unknown error'
        })
        errorCount++
      }

      // Add small delay to avoid overwhelming the Discord API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Create audit log entry
    await prisma.roleAuditLog.create({
      data: {
        allianceId: numericAllianceId,
        actionType: 'bulk_role_sync',
        performedBy: session.user.id,
        roleId: null,
        roleName: `Bulk sync: ${successCount} success, ${errorCount} errors`,
        newPermissions: {
          totalRoles: unsyncedRoles.length,
          successCount,
          errorCount,
          results
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${successCount} roles synced successfully, ${errorCount} errors`,
      summary: {
        totalRoles: unsyncedRoles.length,
        successCount,
        errorCount
      },
      results
    })

  } catch (error) {
    console.error('Bulk role sync error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}