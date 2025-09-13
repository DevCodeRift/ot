import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAllianceAdminPermission } from '@/lib/alliance-admin'

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { roleId } = await context.params

    // Get the role and alliance info
    const role = await prisma.$queryRaw`
      SELECT id, name, description, color, "allianceId", "discordRoleId"
      FROM alliance_roles 
      WHERE id = ${roleId} AND "isActive" = true
    ` as Array<{
      id: string
      name: string
      description: string | null
      color: string | null
      allianceId: number
      discordRoleId: string | null
    }>

    if (role.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const roleData = role[0]

    // Check if user is alliance admin for this role's alliance
    const adminCheck = await checkAllianceAdminPermission(roleData.allianceId, session)
    
    if (!adminCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Alliance Administrator access required' 
      }, { status: 403 })
    }

    // Check if role is already synced
    if (roleData.discordRoleId) {
      return NextResponse.json({
        success: true,
        message: 'Role is already synced to Discord',
        discordRoleId: roleData.discordRoleId,
        alreadySynced: true
      })
    }

    console.log(`Syncing individual role: ${roleData.name} (${roleData.id})`)
    
    // Call Discord bot to create role
    const discordCreateResult = await fetch(`${process.env.NEXTAUTH_URL}/api/bot/create-discord-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
      },
      body: JSON.stringify({
        allianceId: roleData.allianceId,
        roleId: roleData.id,
        roleName: roleData.name,
        roleDescription: roleData.description,
        roleColor: roleData.color
      })
    })

    if (!discordCreateResult.ok) {
      const errorText = await discordCreateResult.text()
      console.error(`Failed to sync role ${roleData.name}:`, errorText)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create Discord role',
        details: errorText
      }, { status: 500 })
    }

    const discordResult = await discordCreateResult.json()
    const discordRoleId = discordResult.discordRoleId
    
    // Update the alliance role with the Discord role ID
    await prisma.$executeRaw`
      UPDATE alliance_roles 
      SET "discordRoleId" = ${discordRoleId}
      WHERE id = ${roleData.id}
    `
    
    console.log(`Successfully synced role: ${roleData.name} (Discord ID: ${discordRoleId})`)

    // Create audit log entry
    await prisma.roleAuditLog.create({
      data: {
        allianceId: roleData.allianceId,
        actionType: 'individual_role_sync',
        performedBy: session.user.id,
        roleId: roleData.id,
        roleName: roleData.name,
        newPermissions: {
          discordRoleId: discordRoleId,
          syncMethod: 'individual'
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Role "${roleData.name}" synced successfully to Discord`,
      discordRoleId: discordRoleId,
      roleName: roleData.name
    })

  } catch (error) {
    console.error('Individual role sync error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}