import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Debug endpoint to test Discord API access
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.accessToken,
      userId: session?.user?.id,
      accessTokenLength: session?.accessToken?.length || 0,
      // Don't log the actual token for security
      accessTokenPreview: session?.accessToken ? `${session.accessToken.substring(0, 10)}...` : 'none'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check session' }, { status: 500 })
  }
}