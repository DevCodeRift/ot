import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/modules/membership/members - Fetch alliance members using the alliance API key
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get alliance ID from query parameter or session
    const { searchParams } = new URL(request.url)
    let allianceId = searchParams.get('allianceId') ? parseInt(searchParams.get('allianceId')!) : null
    
    // Get sorting parameters
    const sortBy = searchParams.get('sortBy') || 'nation_name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    // Validate sorting parameters
    const validSortBy = ['nation_name', 'cities', 'position', 'last_active', 'score']
    const validSortOrder = ['asc', 'desc']
    
    if (!validSortBy.includes(sortBy)) {
      return NextResponse.json({ 
        error: `Invalid sortBy parameter: ${sortBy}. Valid options: ${validSortBy.join(', ')}` 
      }, { status: 400 })
    }
    
    if (!validSortOrder.includes(sortOrder)) {
      return NextResponse.json({ 
        error: `Invalid sortOrder parameter: ${sortOrder}. Valid options: ${validSortOrder.join(', ')}` 
      }, { status: 400 })
    }
    
    console.log('Sorting parameters:', { sortBy, sortOrder })
    
    // If not provided as parameter, try to get it from session
    if (!allianceId) {
      allianceId = session.user.currentAllianceId || null
    }

    // If still not found, try to get it from the user's profile
    if (!allianceId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currentAllianceId: true }
      })
      allianceId = user?.currentAllianceId || null
    }

    if (!allianceId) {
      return NextResponse.json({ 
        error: 'No alliance association found. Please link your account to an alliance.' 
      }, { status: 400 })
    }

    console.log('Fetching members for alliance ID:', allianceId)

    // Check if user has access to the membership module for this alliance
    const moduleAccess = await prisma.allianceModule.findFirst({
      where: {
        allianceId: allianceId,
        moduleId: 'membership',
        enabled: true
      },
      include: {
        alliance: {
          include: {
            apiKey: true
          }
        }
      }
    })

    if (!moduleAccess) {
      return NextResponse.json({ 
        error: 'Membership module not enabled for your alliance' 
      }, { status: 403 })
    }

    // Check if alliance has an active API key
    const apiKey = moduleAccess.alliance.apiKey
    if (!apiKey || !apiKey.isActive) {
      return NextResponse.json({ 
        error: 'Alliance API key not configured. Contact your alliance administrator.' 
      }, { status: 400 })
    }

    // Fetch alliance members from Politics & War API
    const membersQuery = `{
      alliances(id: ${allianceId}) {
        data {
          id
          name
          acronym
          nations {
            id
            nation_name
            leader_name
            alliance_position
            alliance_position_id
            alliance_position_info {
              id
              name
              position_level
              leader
              heir
              officer
              member
            }
            num_cities
            score
            last_active
          }
        }
      }
    }`

    const apiUrl = new URL('https://api.politicsandwar.com/graphql')
    apiUrl.searchParams.set('api_key', apiKey.apiKey)
    apiUrl.searchParams.set('query', membersQuery)

    console.log('Fetching members for alliance:', allianceId)

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
    })

    if (!response.ok) {
      console.error('P&W API error:', response.status, response.statusText)
      return NextResponse.json({ 
        error: `Failed to fetch alliance data: ${response.status}` 
      }, { status: 500 })
    }

    const data = await response.json()

    if (data.errors) {
      console.error('P&W API GraphQL errors:', data.errors)
      return NextResponse.json({ 
        error: data.errors[0]?.message || 'Failed to fetch alliance members' 
      }, { status: 500 })
    }

    if (!data.data?.alliances?.data || data.data.alliances.data.length === 0) {
      return NextResponse.json({ 
        error: 'Alliance not found or no access to alliance data' 
      }, { status: 404 })
    }

    const alliance = data.data.alliances.data[0]
    const members = alliance.nations || []

    console.log(`Found ${members.length} members for alliance ${alliance.name}`)

    // Format member data and add nation URLs
    const formattedMembers = members.map((member: any) => {
      try {
        return {
          id: member.id,
          nation_name: member.nation_name,
          leader_name: member.leader_name,
          alliance_position: member.alliance_position,
          alliance_position_id: member.alliance_position_id,
          alliance_position_info: member.alliance_position_info,
          cities: member.num_cities,
          score: member.score,
          last_active: member.last_active,
          nation_url: `https://politicsandwar.com/nation/id=${member.id}`
        }
      } catch (error) {
        console.error('Error formatting member:', member, error)
        return null
      }
    }).filter(Boolean) // Remove any null entries

    console.log(`Formatted ${formattedMembers.length} members successfully`)

    // Sort the members based on the provided parameters
    console.log('Starting sort operation with:', { sortBy, sortOrder })
    const sortedMembers = formattedMembers.sort((a: any, b: any) => {
      let comparison = 0
      
      try {
        switch (sortBy) {
          case 'cities':
            const aCities = a.cities || 0
            const bCities = b.cities || 0
            comparison = aCities - bCities
            break
          case 'position':
            // Use position level if available, otherwise fall back to position ID (lower is higher rank)
            const aLevel = a.alliance_position_info?.position_level || (10 - (a.alliance_position_id || 0))
            const bLevel = b.alliance_position_info?.position_level || (10 - (b.alliance_position_id || 0))
            comparison = bLevel - aLevel // Higher level = higher rank
            break
          case 'last_active':
            if (!a.last_active || !b.last_active) {
              // Put items without last_active at the end
              if (!a.last_active && !b.last_active) return 0
              return a.last_active ? -1 : 1
            }
            const aDate = new Date(a.last_active)
            const bDate = new Date(b.last_active)
            if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
              // Handle invalid dates
              if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0
              return isNaN(aDate.getTime()) ? 1 : -1
            }
            comparison = aDate.getTime() - bDate.getTime()
            break
          case 'score':
            const aScore = a.score || 0
            const bScore = b.score || 0
            comparison = aScore - bScore
            break
          case 'nation_name':
          default:
            const aName = a.nation_name || ''
            const bName = b.nation_name || ''
            comparison = aName.localeCompare(bName)
            break
        }
      } catch (error) {
        console.error('Error sorting members:', error)
        return 0 // Return 0 for equal if there's an error
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    console.log('Sort operation completed successfully')

    // Update the API key's last used timestamp
    await prisma.allianceApiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() }
    })

    return NextResponse.json({
      success: true,
      alliance: {
        id: alliance.id,
        name: alliance.name,
        acronym: alliance.acronym
      },
      members: sortedMembers,
      memberCount: sortedMembers.length,
      sortBy,
      sortOrder
    })

  } catch (error) {
    console.error('Fetch alliance members error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
