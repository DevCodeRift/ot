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
    const botPermissions = permissions || [
      'VIEW_CHANNELS',          // 1024 (0x400)
      'SEND_MESSAGES',          // 2048 (0x800)
      'USE_SLASH_COMMANDS',     // 2147483648 (0x80000000)
      'MANAGE_MESSAGES',        // 8192 (0x2000)
      'EMBED_LINKS',           // 16384 (0x4000)
      'ATTACH_FILES',          // 32768 (0x8000)
      'READ_MESSAGE_HISTORY',   // 65536 (0x10000)
      'ADD_REACTIONS',         // 64 (0x40)
      'USE_EXTERNAL_EMOJIS',   // 262144 (0x40000)
      'CONNECT',               // 1048576 (0x100000) - for voice channels
      'SPEAK'                  // 2097152 (0x200000) - for voice channels
    ]

    // Calculate permission integer (sum of all permission values)
    const permissionMap: Record<string, number> = {
      'VIEW_CHANNELS': 1024,
      'SEND_MESSAGES': 2048,
      'USE_SLASH_COMMANDS': 2147483648,
      'MANAGE_MESSAGES': 8192,
      'EMBED_LINKS': 16384,
      'ATTACH_FILES': 32768,
      'READ_MESSAGE_HISTORY': 65536,
      'ADD_REACTIONS': 64,
      'USE_EXTERNAL_EMOJIS': 262144,
      'CONNECT': 1048576,
      'SPEAK': 2097152
    }

    const permissionValue = botPermissions.reduce((sum: number, perm: string) => {
      return sum + (permissionMap[perm] || 0)
    }, 0)

    // Generate Discord OAuth2 authorize URL
    const scope = 'bot applications.commands'
    const inviteUrl = new URL('https://discord.com/api/oauth2/authorize')
    
    inviteUrl.searchParams.set('client_id', botClientId)
    inviteUrl.searchParams.set('permissions', permissionValue.toString())
    inviteUrl.searchParams.set('scope', scope)
    inviteUrl.searchParams.set('guild_id', serverId)
    
    // Optional: Add redirect URI for post-invite handling
    const redirectUri = process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/bot/invite-success`
      : undefined
    
    if (redirectUri) {
      inviteUrl.searchParams.set('redirect_uri', redirectUri)
    }

    // Log the invite attempt for audit purposes
    console.log(`Bot invite generated for user ${session.user.id} to server ${serverId}`)

    return NextResponse.json({
      success: true,
      inviteUrl: inviteUrl.toString(),
      permissions: botPermissions,
      permissionValue,
      serverId,
      botClientId,
      timestamp: new Date().toISOString()
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
      requiredPermissions: [
        'VIEW_CHANNELS',
        'SEND_MESSAGES',
        'USE_SLASH_COMMANDS',
        'MANAGE_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'READ_MESSAGE_HISTORY',
        'ADD_REACTIONS',
        'USE_EXTERNAL_EMOJIS',
        'CONNECT',
        'SPEAK'
      ],
      features: [
        'Alliance member management commands',
        'War coordination and tracking',
        'Quest assignment and progress tracking',
        'Economic monitoring and alerts',
        'Real-time sync with webapp data',
        'Role-based command permissions'
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