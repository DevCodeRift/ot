import { NextRequest, NextResponse } from 'next/server'
import { checkRoleManagerPermission } from '@/lib/role-permissions'

export async function GET(req: NextRequest) {
  try {
    const roleInfo = await checkRoleManagerPermission()

    return NextResponse.json({
      hasPermission: roleInfo.hasRole || roleInfo.isAllianceAdmin,
      roleInfo
    })

  } catch (error) {
    console.error('Error checking role manager permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}