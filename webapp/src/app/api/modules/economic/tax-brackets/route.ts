import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/modules/economic/tax-brackets - Fetch alliance tax brackets from P&W API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get alliance ID from query parameter
    const { searchParams } = new URL(request.url)
    const allianceId = searchParams.get('allianceId')
    
    if (!allianceId) {
      return NextResponse.json({ error: 'Alliance ID is required' }, { status: 400 })
    }

    console.log('Fetching tax brackets for alliance ID:', allianceId)

    // Check if user has access to the banking module for this alliance
    const moduleAccess = await prisma.allianceModule.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        moduleId: 'banking',
        enabled: true
      }
    })

    if (!moduleAccess) {
      return NextResponse.json({ 
        error: 'Banking module not enabled for this alliance' 
      }, { status: 403 })
    }

    // Get alliance API key
    const apiKey = await prisma.allianceApiKey.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        isActive: true
      }
    })

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No active API key found for this alliance' 
      }, { status: 400 })
    }

    // Fetch tax brackets from P&W API
    const taxBracketsQuery = `{
      alliances(id: [${allianceId}]) {
        data {
          id
          name
          tax_brackets {
            id
            bracket_name
            tax_rate
            resource_tax_rate
            date
            date_modified
            last_modifier_id
            last_modifier {
              id
              nation_name
              leader_name
            }
          }
        }
      }
    }`

    const apiUrl = new URL('https://api.politicsandwar.com/graphql')
    apiUrl.searchParams.set('api_key', apiKey.apiKey)
    apiUrl.searchParams.set('query', taxBracketsQuery)

    console.log('Fetching tax brackets from P&W API')

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
    })

    if (!response.ok) {
      console.error('P&W API error:', response.status, response.statusText)
      return NextResponse.json({ 
        error: `Failed to fetch tax bracket data: ${response.status}` 
      }, { status: 500 })
    }

    const data = await response.json()

    if (data.errors) {
      console.error('P&W API GraphQL errors:', data.errors)
      return NextResponse.json({ 
        error: data.errors[0]?.message || 'Failed to fetch tax brackets' 
      }, { status: 500 })
    }

    if (!data.data?.alliances?.data || data.data.alliances.data.length === 0) {
      return NextResponse.json({ 
        error: 'Alliance not found or no access to tax bracket data' 
      }, { status: 404 })
    }

    const alliance = data.data.alliances.data[0]
    const taxBrackets = alliance.tax_brackets || []

    console.log(`Found ${taxBrackets.length} tax brackets for alliance ${alliance.name}`)

    // Format tax bracket data
    const formattedBrackets = taxBrackets.map((bracket: any) => ({
      id: bracket.id,
      name: bracket.bracket_name,
      moneyTaxRate: bracket.tax_rate,
      resourceTaxRate: bracket.resource_tax_rate,
      dateCreated: bracket.date,
      dateModified: bracket.date_modified,
      lastModifierId: bracket.last_modifier_id,
      lastModifier: bracket.last_modifier ? {
        id: bracket.last_modifier.id,
        nationName: bracket.last_modifier.nation_name,
        leaderName: bracket.last_modifier.leader_name
      } : null
    }))

    // Update the API key's last used timestamp
    await prisma.allianceApiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() }
    })

    return NextResponse.json({
      success: true,
      alliance: {
        id: alliance.id,
        name: alliance.name
      },
      taxBrackets: formattedBrackets,
      bracketCount: formattedBrackets.length
    })

  } catch (error) {
    console.error('Fetch tax brackets error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
