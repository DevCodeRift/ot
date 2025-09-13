import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRoleManagerPermission } from '@/lib/role-permissions'

// GET /api/alliance/members/search - Search for alliance members by nation name or ID
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.currentAllianceId) {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    // Check if user has role assignment permissions
    const roleCheck = await checkRoleManagerPermission()
    
    if (!roleCheck.hasRole) {
      return NextResponse.json({ 
        error: 'Role Manager permissions or Alliance Administrator access required' 
      }, { status: 403 })
    }

    // Get alliance ID from query parameter or user's current alliance
    const { searchParams } = new URL(request.url)
    const nationName = searchParams.get('nationName')
    const nationId = searchParams.get('nationId')
    const queryAllianceId = searchParams.get('allianceId')

    if (!nationName && !nationId) {
      return NextResponse.json({ 
        error: 'Either nationName or nationId parameter is required' 
      }, { status: 400 })
    }

    let allianceId: number
    if (queryAllianceId) {
      allianceId = parseInt(queryAllianceId)
      if (isNaN(allianceId)) {
        return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
      }
    } else if (session.user.currentAllianceId) {
      allianceId = session.user.currentAllianceId
    } else {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    interface UserSearchResult {
      id: string;
      name: string | null;
      discordUsername: string | null;
      pwNationName: string | null;
      pwNationId: number | null;
      currentAllianceId: number | null;
    }

    let users: UserSearchResult[] = []

    if (nationId && !isNaN(Number(nationId))) {
      // Search by nation ID
      users = await prisma.user.findMany({
        where: {
          AND: [
            { pwNationId: Number(nationId) },
            { currentAllianceId: allianceId }
          ]
        },
        select: {
          id: true,
          name: true,
          discordUsername: true,
          pwNationName: true,
          pwNationId: true,
          currentAllianceId: true
        },
        take: 10
      })
    } else if (nationName) {
      // Search by nation name (partial match)
      users = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { pwNationName: { contains: nationName, mode: 'insensitive' } },
                { name: { contains: nationName, mode: 'insensitive' } },
                { discordUsername: { contains: nationName, mode: 'insensitive' } }
              ]
            },
            { currentAllianceId: allianceId }
          ]
        },
        select: {
          id: true,
          name: true,
          discordUsername: true,
          pwNationName: true,
          pwNationId: true,
          currentAllianceId: true
        },
        take: 10
      })
    }

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name || user.discordUsername || user.pwNationName || 'Unknown',
        discordUsername: user.discordUsername,
        pwNationName: user.pwNationName,
        pwNationId: user.pwNationId,
        currentAllianceId: user.currentAllianceId
      }))
    })

  } catch (error) {
    console.error('Member search error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}