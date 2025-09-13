import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRoleManagerPermission } from '@/lib/role-permissions'

export async function GET(req: NextRequest) {
  try {
    const roleInfo = await checkRoleManagerPermission()
    
    if (!roleInfo.hasRole && !roleInfo.isAllianceAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.currentAllianceId) {
      return NextResponse.json({ error: 'No alliance found' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search users by nation name or nation ID
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            currentAllianceId: session.user.currentAllianceId
          },
          {
            OR: [
              {
                pwNationName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                pwNationId: isNaN(parseInt(query)) ? undefined : parseInt(query)
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        pwNationName: true,
        pwNationId: true,
        currentAllianceId: true
      },
      take: 10
    })

    // Get roles separately to avoid Prisma relation issues
    // TODO: Add role fetching when Prisma client is generated
    const usersWithRoles = users.map(user => ({ ...user, allianceRoles: [] }))

    return NextResponse.json({ users: usersWithRoles })

  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}