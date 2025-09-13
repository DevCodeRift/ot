import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Get Discord servers where user has admin permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Discord servers API - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user?.id,
      hasAccessToken: !!session?.accessToken,
      userId: session?.user?.id
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Discord access token from session
    const discordToken = session.accessToken

    if (!discordToken) {
      console.log('No Discord access token in session')
      return NextResponse.json({ 
        error: 'Discord access token not available',
        message: 'Please re-authenticate with Discord'
      }, { status: 400 })
    }

    try {
      console.log('Attempting to fetch Discord guilds...')
      
      // Fetch user's Discord guilds
      const discordResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${discordToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Discord API response status:', discordResponse.status)

      if (!discordResponse.ok) {
        const errorText = await discordResponse.text()
        console.error('Discord API error response:', errorText)
        throw new Error(`Discord API returned ${discordResponse.status}: ${errorText}`)
      }

      const guilds = await discordResponse.json()
      console.log('Fetched guilds count:', guilds.length)

      // Filter guilds where user has administrator permissions (permission & 0x8)
      const adminGuilds = guilds.filter((guild: any) => {
        const permissions = parseInt(guild.permissions)
        return (permissions & 0x8) === 0x8 || guild.owner
      })

      // For each guild, check if our bot is already there
      const botClientId = process.env.DISCORD_CLIENT_ID
      const guildsWithBotStatus = await Promise.all(
        adminGuilds.map(async (guild: any) => {
          try {
            // Try to get bot member info (this requires bot token, so we'll mock it for now)
            return {
              id: guild.id,
              name: guild.name,
              icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
              owner: guild.owner,
              permissions: guild.permissions,
              botInvited: false // We'll implement actual checking later
            }
          } catch {
            return {
              id: guild.id,
              name: guild.name,
              icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
              owner: guild.owner,
              permissions: guild.permissions,
              botInvited: false
            }
          }
        })
      )

      return NextResponse.json({
        success: true,
        servers: guildsWithBotStatus
      })

    } catch (discordError) {
      console.error('Discord API error:', discordError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Discord servers',
        details: discordError instanceof Error ? discordError.message : 'Unknown error'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Get Discord servers error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch Discord servers'
      },
      { status: 500 }
    )
  }
}