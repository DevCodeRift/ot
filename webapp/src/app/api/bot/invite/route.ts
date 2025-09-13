import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Generate Discord bot invite link with proper permissions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serverId, permissions } = body

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 })
    }

    const botClientId = process.env.DISCORD_CLIENT_ID
    if (!botClientId) {
      return NextResponse.json({ 
        error: 'Discord bot not configured',
        message: 'DISCORD_CLIENT_ID environment variable is missing'
      }, { status: 500 })
    }

    // Define bot permissions for Politics & War Alliance Management
    // Using a tested permission set - let's start with essential permissions
    const defaultPermissions = 139586817088 // Essential bot permissions for testing
    // This includes: Send Messages, Manage Messages, Embed Links, Read Message History, 
    // Use Slash Commands, Add Reactions, View Channels, Manage Roles

    const permissionValue = permissions ? 
      (typeof permissions === 'number' ? permissions : defaultPermissions) : 
      defaultPermissions

    // Generate Discord OAuth2 authorize URL for bot invite
    const scope = 'bot applications.commands'
    const inviteUrl = new URL('https://discord.com/api/oauth2/authorize')
    
    inviteUrl.searchParams.set('client_id', botClientId)
    inviteUrl.searchParams.set('permissions', permissionValue.toString())
    inviteUrl.searchParams.set('scope', scope)
    inviteUrl.searchParams.set('guild_id', serverId)
    
    // Bot invites don't typically use redirect URIs
    // The user will be redirected back to Discord after the invite

    // Log the invite attempt for audit purposes
    console.log(`Bot invite generated for user ${session.user.id} to server ${serverId}`)
    console.log(`Permission value: ${permissionValue}`)
    console.log(`Generated URL: ${inviteUrl.toString()}`)

    return NextResponse.json({
      success: true,
      inviteUrl: inviteUrl.toString(),
      permissionValue,
      serverId,
      botClientId,
      timestamp: new Date().toISOString(),
      note: 'Using comprehensive bot permissions for alliance management'
    })

  } catch (error) {
    console.error('Generate bot invite error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to generate bot invite link'
      },
      { status: 500 }
    )
  }
}

// Get bot invite information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const botClientId = process.env.DISCORD_CLIENT_ID
    
    return NextResponse.json({
      success: true,
      botClientId: botClientId || null,
      configured: !!botClientId,
      permissionValue: 2270348099808337,
      requiredPermissions: [
        'Manage Roles', 'Manage Channels', 'Create Instant Invite', 
        'Change Nickname', 'Manage Nicknames', 'View Channels',
        'Manage Events', 'Create Events', 'Send Messages',
        'Create Public Threads', 'Create Private Threads', 'Send Messages in Threads',
        'Manage Messages', 'Pin Messages', 'Manage Threads',
        'Embed Links', 'Read Message History', 'Add Reactions',
        'Use Slash Commands', 'Use Embedded Activities', 'Use Embedded Activities (Voice)'
      ],
      features: [
        'Alliance member management commands',
        'War coordination and tracking', 
        'Quest assignment and progress tracking',
        'Economic monitoring and alerts',
        'Real-time sync with webapp data',
        'Role-based command permissions',
        'Event management and coordination',
        'Thread-based discussions'
      ]
    })

  } catch (error) {
    console.error('Get bot invite info error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to get bot invite information'
      },
      { status: 500 }
    )
  }
}