import { prisma } from '@/lib/prisma'

export interface UserIdentificationRequest {
  discordUserId?: string
  discordUsername?: string
  nationName?: string
  nationId?: number
  allianceId?: number
}

export interface UserIdentificationResult {
  found: boolean
  user?: any
  canCreateUser: boolean
  identifiedBy?: string
  suggestions?: string[]
}

/**
 * Enhanced user identification system that can match users by multiple criteria
 * and handle users who haven't signed up yet
 */
export async function identifyUser(params: UserIdentificationRequest): Promise<UserIdentificationResult> {
  const { discordUserId, discordUsername, nationName, nationId, allianceId } = params
  
  let user = null
  let identifiedBy = ''
  const suggestions: string[] = []

  // 1. Try to find by Discord ID (most reliable)
  if (discordUserId) {
    user = await prisma.user.findFirst({
      where: { discordId: discordUserId },
      include: {
        nation: true
      }
    })
    
    if (user) {
      identifiedBy = 'Discord ID'
      return {
        found: true,
        user,
        canCreateUser: false,
        identifiedBy
      }
    }
  }

  // 2. Try to find by Nation ID (if provided)
  if (nationId) {
    user = await prisma.user.findFirst({
      where: { pwNationId: nationId },
      include: {
        nation: true
      }
    })
    
    if (user) {
      identifiedBy = 'Nation ID'
      
      // If Discord ID is provided but doesn't match, suggest linking
      if (discordUserId && user.discordId !== discordUserId) {
        suggestions.push(`User found by Nation ID but Discord ID doesn't match. Consider linking Discord account.`)
      }
      
      return {
        found: true,
        user,
        canCreateUser: false,
        identifiedBy,
        suggestions
      }
    }
  }

  // 3. Try to find by Nation Name (less reliable, multiple matches possible)
  if (nationName) {
    const users = await prisma.user.findMany({
      where: { 
        pwNationName: {
          contains: nationName,
          mode: 'insensitive'
        }
      },
      include: {
        nation: true
      },
      take: 5 // Limit to avoid too many results
    })
    
    // Look for exact match first
    const exactMatch = users.find(u => 
      u.pwNationName?.toLowerCase() === nationName.toLowerCase()
    )
    
    if (exactMatch) {
      identifiedBy = 'Nation Name (exact match)'
      
      // Check if alliance matches
      if (allianceId && exactMatch.currentAllianceId !== allianceId) {
        suggestions.push(`User found but belongs to different alliance (${exactMatch.currentAllianceId} vs ${allianceId})`)
      }
      
      return {
        found: true,
        user: exactMatch,
        canCreateUser: false,
        identifiedBy,
        suggestions
      }
    }
    
    // If multiple partial matches, suggest them
    if (users.length > 0) {
      suggestions.push(`Found ${users.length} users with similar nation names: ${users.map(u => u.pwNationName).join(', ')}`)
    }
  }

  // 4. Try to find by Discord Username (least reliable)
  if (discordUsername) {
    const users = await prisma.user.findMany({
      where: { 
        discordUsername: {
          contains: discordUsername,
          mode: 'insensitive'
        }
      },
      include: {
        nation: true
      },
      take: 5
    })
    
    const exactMatch = users.find(u => 
      u.discordUsername?.toLowerCase() === discordUsername.toLowerCase()
    )
    
    if (exactMatch) {
      identifiedBy = 'Discord Username'
      
      // Check if Discord ID matches if provided
      if (discordUserId && exactMatch.discordId !== discordUserId) {
        suggestions.push(`User found by Discord username but Discord ID doesn't match. This may be an old username.`)
      }
      
      return {
        found: true,
        user: exactMatch,
        canCreateUser: false,
        identifiedBy,
        suggestions
      }
    }
    
    if (users.length > 0) {
      suggestions.push(`Found ${users.length} users with similar Discord usernames: ${users.map(u => u.discordUsername).join(', ')}`)
    }
  }

  // User not found - determine if we can create a placeholder user
  const canCreateUser = !!(discordUserId || (nationId && allianceId))
  
  if (canCreateUser) {
    suggestions.push('User not found but can create placeholder user with available information')
  } else {
    suggestions.push('User not found and insufficient information to create placeholder user')
  }

  return {
    found: false,
    canCreateUser,
    suggestions
  }
}

/**
 * Create a placeholder user for Discord role sync when user hasn't signed up yet
 */
export async function createPlaceholderUser(params: {
  discordUserId: string
  discordUsername?: string
  nationId?: number
  nationName?: string
  allianceId?: number
}): Promise<any> {
  const { discordUserId, discordUsername, nationId, nationName, allianceId } = params
  
  // Check if user already exists
  const existing = await prisma.user.findFirst({
    where: { discordId: discordUserId }
  })
  
  if (existing) {
    throw new Error('User already exists with this Discord ID')
  }
  
  // Create placeholder user
  const userData: any = {
    discordId: discordUserId,
    discordUsername: discordUsername || `User_${discordUserId.slice(-6)}`,
    name: nationName || `Nation_${nationId || 'Unknown'}`,
    pwNationId: nationId || null,
    pwNationName: nationName || null,
    currentAllianceId: allianceId || null,
    // Mark as placeholder for future reference
    emailVerified: null, // Indicates this is a placeholder account
  }
  
  const user = await prisma.user.create({
    data: userData
  })
  
  console.log(`Created placeholder user for Discord sync: ${user.discordUsername} (${discordUserId})`)
  
  return user
}