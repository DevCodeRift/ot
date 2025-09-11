import { GraphQLClient } from 'graphql-request'

const POLITICS_WAR_GRAPHQL_URL = 'https://api.politicsandwar.com/graphql'

export class PoliticsWarAPI {
  private client: GraphQLClient
  private apiKey: string
  private rateLimitInfo: {
    remaining: number
    resetTime: Date
  } = {
    remaining: 2000,
    resetTime: new Date()
  }

  constructor(apiKey: string) {
    this.apiKey = apiKey
    // Note: We're using direct fetch instead of GraphQLClient for Politics & War API
    this.client = new GraphQLClient(POLITICS_WAR_GRAPHQL_URL)
  }

  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitInfo.remaining <= 0 && new Date() < this.rateLimitInfo.resetTime) {
      const waitTime = this.rateLimitInfo.resetTime.getTime() - Date.now()
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`)
    }
  }

  private updateRateLimit(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining')
    const resetTime = headers.get('x-ratelimit-reset')
    
    if (remaining) {
      this.rateLimitInfo.remaining = parseInt(remaining)
    }
    
    if (resetTime) {
      this.rateLimitInfo.resetTime = new Date(parseInt(resetTime) * 1000)
    }
  }

  async request<T>(query: string, variables?: any): Promise<T> {
    await this.checkRateLimit()
    
    try {
      // Politics & War API expects the key as a URL parameter, not header
      const url = new URL(POLITICS_WAR_GRAPHQL_URL)
      url.searchParams.set('api_key', this.apiKey)
      url.searchParams.set('query', query)
      
      // Add variables if provided
      if (variables) {
        url.searchParams.set('variables', JSON.stringify(variables))
      }
      
      console.log('P&W API URL:', url.toString())
      console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10))
      
      const response = await fetch(url.toString(), {
        method: 'GET',
      })

      this.updateRateLimit(response.headers)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors.map((e: any) => e.message).join(', ')}`)
      }

      return data.data
    } catch (error) {
      console.error('Politics & War API request failed:', error)
      throw error
    }
  }

  // Validate API key by getting user info
  async validateApiKey(): Promise<{
    valid: boolean
    nation?: {
      id: number
      nation_name: string
      leader_name: string
      alliance_id: number
      alliance?: {
        id: number
        name: string
        acronym: string
      }
    }
    error?: string
  }> {
    try {
      const query = `{me{nation{id nation_name leader_name alliance_id alliance{id name acronym}}}}`
      
      const data = await this.request<{
        me: {
          nation: {
            id: number
            nation_name: string
            leader_name: string
            alliance_id: number
            alliance?: {
              id: number
              name: string
              acronym: string
            }
          }
        }
      }>(query)

      return {
        valid: true,
        nation: data.me.nation
      }
    } catch (error) {
      console.error('API key validation failed:', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get nation by ID
  async getNation(nationId: number) {
    const query = `
      query GetNation($id: ID!) {
        nations(id: [$id], first: 1) {
          data {
            id
            nation_name
            leader_name
            alliance_id
            alliance {
              id
              name
              acronym
            }
            continent
            war_policy
            domestic_policy
            color
            num_cities
            score
            population
            flag
            vacation_mode_turns
            beige_turns
            last_active
            date
            soldiers
            tanks
            aircraft
            ships
            missiles
            nukes
          }
        }
      }
    `
    
    return this.request(query, { id: nationId.toString() })
  }

  // Get alliance by ID
  async getAlliance(allianceId: number) {
    const query = `
      query GetAlliance($id: ID!) {
        alliances(id: [$id], first: 1) {
          data {
            id
            name
            acronym
            score
            color
            date
            accept_members
            flag
            forum_link
            discord_link
            wiki_link
          }
        }
      }
    `
    
    return this.request(query, { id: allianceId.toString() })
  }

  // Get alliance members
  async getAllianceMembers(allianceId: number) {
    const query = `
      query GetAllianceMembers($allianceId: [ID!]) {
        nations(alliance_id: $allianceId, first: 500) {
          data {
            id
            nation_name
            leader_name
            alliance_position
            score
            num_cities
            color
            last_active
            vacation_mode_turns
            beige_turns
          }
          paginatorInfo {
            hasMorePages
            lastPage
          }
        }
      }
    `
    
    return this.request(query, { allianceId: [allianceId.toString()] })
  }
}
