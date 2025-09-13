import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAllianceAdminPermission } from '@/lib/role-permissions'
import { z } from 'zod'

// Schema for role creation
const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().optional(),
  modulePermissions: z.array(z.string()).default([]),
  canAssignRoles: z.boolean().default(false),
  canCreateQuests: z.boolean().default(false),
  canManageMembers: z.boolean().default(false),
  canViewWarData: z.boolean().default(false),
  canManageEconomics: z.boolean().default(false),
  canManageRecruitment: z.boolean().default(false),
  displayOrder: z.number().default(0)
})

// GET /api/alliance/roles - Get all roles for alliance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.currentAllianceId) {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    // Check if user is alliance admin
    const adminCheck = await checkAllianceAdminPermission(session.user.currentAllianceId)
    
    if (!adminCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Alliance Administrator access required' 
      }, { status: 403 })
    }

    // Return empty roles array until database tables are created
    return NextResponse.json({
      roles: [],
      message: 'Role management system ready - database tables need to be created',
      status: 'pending_setup'
    })

  } catch (error) {
    console.error('Get alliance roles error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Unable to load roles. Database may not be properly configured.'
    }, { status: 500 })
  }
}

// POST /api/alliance/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.currentAllianceId) {
      return NextResponse.json({ error: 'User not in an alliance' }, { status: 400 })
    }

    // Check if user is alliance admin
    const adminCheck = await checkAllianceAdminPermission(session.user.currentAllianceId)
    
    if (!adminCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Alliance Administrator access required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createRoleSchema.parse(body)

    // Return mock response until database is set up
    return NextResponse.json({
      success: true,
      message: 'Role creation will be available once database tables are created',
      role: {
        id: 'mock-role-id',
        ...validatedData
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    console.error('Create role error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}