import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkModuleAccess } from '@/lib/module-access'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const allianceId = searchParams.get('allianceId')
    
    if (!allianceId) {
      return NextResponse.json({ error: 'Alliance ID is required' }, { status: 400 })
    }

    // Check if user has access to the economic module
    const access = await checkModuleAccess('economic')
    
    if (!access.hasAccess) {
      return NextResponse.json({ 
        error: access.error || 'Economic Tools module not enabled for this alliance' 
      }, { status: 403 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Access granted to Economic Tools module',
      features: {
        taxManagement: true,
        holdings: true,
        bankAccess: true
      }
    })

  } catch (error) {
    console.error('Economic module access check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
