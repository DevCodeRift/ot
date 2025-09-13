import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Get Discord servers where user has admin permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Discord access token from session
    const discordToken = session.accessToken

    if (!discordToken) {
      return NextResponse.json({ 
        error: 'Discord access token not available',
        message: 'Please re-authenticate with Discord'
      }, { status: 400 })
    }

    try {
      // Fetch user's Discord guilds
      const discordResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${discordToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!discordResponse.ok) {
        throw new Error(`Discord API returned ${discordResponse.status}`)
      }

      const guilds = await discordResponse.json()

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
      
      // Return mock data for development
      const mockServers = [
        {
          id: '123456789012345678',
          name: 'Rose Alliance Discord',
          icon: null,
          owner: true,
          permissions: '8',
          botInvited: false
        },
        {
          id: '876543210987654321',
          name: 'Alliance War Room',
          icon: null,
          owner: false,
          permissions: '8',
          botInvited: false
        }
      ]

      return NextResponse.json({
        success: true,
        servers: mockServers,
        note: 'Mock data - Discord API not available'
      })
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