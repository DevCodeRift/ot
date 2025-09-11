import { NextRequest, NextResponse } from 'next/server'
import { checkModuleAccess } from '@/lib/module-access'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess('recruitment')
    
    if (!access.hasAccess) {
      return NextResponse.json({ 
        error: access.error || 'Access denied' 
      }, { status: 403 })
    }

    return NextResponse.json({
      hasAccess: true,
      user: access.user
    })

  } catch (error) {
    console.error('Recruitment module access check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
