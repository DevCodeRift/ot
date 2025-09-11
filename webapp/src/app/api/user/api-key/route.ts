import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PoliticsWarAPI } from '@/lib/politics-war-api'

export async function POST(request: NextRequest) {
  try {
    console.log('=== API Key Validation Request Started ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'exists' : 'null')
    console.log('User ID:', session?.user?.id || 'no user id')
    
    if (!session?.user?.id) {
      console.log('❌ No valid session, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey } = await request.json()
    console.log('API key received:', apiKey ? 'yes' : 'no')

    if (!apiKey || typeof apiKey !== 'string') {
      console.log('❌ No API key provided')
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Verify user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!existingUser) {
      console.log('❌ User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('✅ User verified:', existingUser.id)

    // Validate API key with Politics & War
    console.log('Starting API key validation for user:', session.user.id)
    const pwAPI = new PoliticsWarAPI(apiKey)
    let validation
    
    try {
      console.log('Calling pwAPI.validateApiKey()...')
      validation = await pwAPI.validateApiKey()
      console.log('API validation result:', validation)
    } catch (error) {
      console.error('API key validation error:', error)
      return NextResponse.json({ 
        error: 'Failed to validate API key. Please ensure your key is correct and try again. If the problem persists, the Politics & War API may be temporarily unavailable.' 
      }, { status: 400 })
    }

    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid API key. Please check your key and try again.' 
      }, { status: 400 })
    }

    if (!validation.nation) {
      return NextResponse.json({ 
        error: 'Could not retrieve nation data. Please try again.' 
      }, { status: 400 })
    }

    // Create or update nation record FIRST (before updating user)
    console.log('Creating/updating nation record...')
    const nationId = parseInt(validation.nation.id.toString())
    const allianceId = validation.nation.alliance_id ? parseInt(validation.nation.alliance_id.toString()) : null
    console.log('Nation data:', { nationId, allianceId, nationName: validation.nation.nation_name })
    
    await prisma.nation.upsert({
      where: { id: nationId },
      update: {
        nationName: validation.nation.nation_name,
        leaderName: validation.nation.leader_name,
        allianceId: allianceId,
        discordId: session.user.discordId || null,
        updatedAt: new Date(),
      },
      create: {
        id: nationId,
        nationName: validation.nation.nation_name,
        leaderName: validation.nation.leader_name,
        allianceId: allianceId,
        discordId: session.user.discordId || null,
      },
    })
    console.log('Nation record created/updated successfully')

    // Create or update alliance record if nation is in an alliance
    if (validation.nation.alliance_id && validation.nation.alliance) {
      console.log('Creating/updating alliance record...')
      const allianceId = parseInt(validation.nation.alliance_id.toString())
      console.log('Alliance data:', { allianceId, name: validation.nation.alliance.name, acronym: validation.nation.alliance.acronym })
      
      await prisma.alliance.upsert({
        where: { id: allianceId },
        update: {
          name: validation.nation.alliance.name,
          acronym: validation.nation.alliance.acronym,
          updatedAt: new Date(),
        },
        create: {
          id: allianceId,
          name: validation.nation.alliance.name,
          acronym: validation.nation.alliance.acronym,
        },
      })
      console.log('Alliance record created/updated successfully')
    }

    // Now update user with API key and nation info (after nation exists)
    console.log('Updating user record...')
    const userData = {
      pwApiKey: apiKey,
      pwNationId: nationId,
      pwNationName: validation.nation.nation_name,
      currentAllianceId: allianceId,
    }
    console.log('User update data:', userData)
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: userData,
    })
    console.log('User record updated successfully')

    return NextResponse.json({
      success: true,
      nation: validation.nation,
    })

  } catch (error) {
    console.error('API key validation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stringified: JSON.stringify(error, null, 2)
    })
    return NextResponse.json({ 
      error: 'Internal server error. Please try again.' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove API key and P&W data from user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pwApiKey: null,
        pwNationId: null,
        pwNationName: null,
        currentAllianceId: null,
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API key removal error:', error)
    return NextResponse.json({ 
      error: 'Internal server error. Please try again.' 
    }, { status: 500 })
  }
}
