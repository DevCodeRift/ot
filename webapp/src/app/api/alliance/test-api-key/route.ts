import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/alliance/test-api-key - Test a P&W API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Test the API key by making a simple query using the correct P&W API format
    const testQuery = `{me{nation{id nation_name leader_name}}}`
    
    const testUrl = new URL('https://api.politicsandwar.com/graphql')
    testUrl.searchParams.set('api_key', apiKey)
    testUrl.searchParams.set('query', testQuery)

    const response = await fetch(testUrl.toString(), {
      method: 'GET',
    })

    if (!response.ok) {
      return NextResponse.json({ 
        valid: false, 
        error: `API request failed: ${response.status}` 
      }, { status: 200 })
    }

    const data = await response.json()

    if (data.errors) {
      return NextResponse.json({ 
        valid: false, 
        error: data.errors[0]?.message || 'API key validation failed' 
      }, { status: 200 })
    }

    // Check if we got valid data back
    if (!data.data?.me?.nation) {
      return NextResponse.json({ 
        valid: false, 
        error: 'API key validation failed - no nation data returned' 
      }, { status: 200 })
    }

    return NextResponse.json({ 
      valid: true, 
      message: 'API key is valid',
      nation: {
        id: data.data.me.nation.id,
        name: data.data.me.nation.nation_name,
        leader: data.data.me.nation.leader_name
      }
    })

  } catch (error) {
    console.error('API key test error:', error)
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to test API key' 
    }, { status: 200 })
  }
}
