import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addAdminSchema = z.object({
  discordId: z.string().min(1, 'Discord ID is required'),
  role: z.enum(['admin', 'moderator', 'manager']).default('admin')
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a super admin
    const adminDiscordIds = process.env.ADMIN_DISCORD_IDS?.split(',') || []
    if (!session.user.discordId || !adminDiscordIds.includes(session.user.discordId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const allianceId = parseInt(params.id)
    if (isNaN(allianceId)) {
      return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
    }

    const body = await request.json()
    const { discordId, role } = addAdminSchema.parse(body)

    // Find or create user for this Discord ID
    let user = await prisma.user.findUnique({
      where: { discordId }
    })

    if (!user) {
      // Create a basic user record for this Discord ID
      user = await prisma.user.create({
        data: {
          discordId,
          discordUsername: null // Will be updated when they sign in
        }
      })
    }

    // Check if user already exists as admin for this alliance
    const existingAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId,
        userId: user.id
      }
    })

    if (existingAdmin) {
      return NextResponse.json({ error: 'User is already an admin for this alliance' }, { status: 400 })
    }

    // Create the admin
    const admin = await prisma.allianceAdmin.create({
      data: {
        allianceId,
        userId: user.id,
        discordId,
        role,
        addedBy: session.user.discordId!,
        addedAt: new Date()
      },
      include: {
        user: true
      }
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        discordId: admin.discordId,
        discordUsername: admin.user.discordUsername,
        role: admin.role,
        addedAt: admin.addedAt
      }
    })
  } catch (error) {
    console.error('Error adding alliance admin:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a super admin
    const adminDiscordIds = process.env.ADMIN_DISCORD_IDS?.split(',') || []
    if (!session.user.discordId || !adminDiscordIds.includes(session.user.discordId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const allianceId = parseInt(params.id)
    if (isNaN(allianceId)) {
      return NextResponse.json({ error: 'Invalid alliance ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Check if admin exists
    const admin = await prisma.allianceAdmin.findFirst({
      where: {
        id: adminId,
        allianceId
      }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Delete the admin
    await prisma.allianceAdmin.delete({
      where: {
        id: adminId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin removed successfully'
    })
  } catch (error) {
    console.error('Error removing alliance admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}