import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/alliance/admin-info - Get alliance info for current admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an alliance admin
    const allianceAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        discordId: session.user.discordId,
        isActive: true
      },
      include: {
        alliance: {
          include: {
            apiKey: true
          }
        }
      }
    })

    if (!allianceAdmin) {
      return NextResponse.json({ error: 'Not an alliance administrator' }, { status: 403 })
    }

    return NextResponse.json({
      alliance: {
        id: allianceAdmin.alliance.id,
        name: allianceAdmin.alliance.name,
        acronym: allianceAdmin.alliance.acronym,
        hasApiKey: !!allianceAdmin.alliance.apiKey?.isActive,
        isAdmin: true
      }
    })

  } catch (error) {
    console.error('Alliance admin info error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
