// Test database operations directly
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseOperations() {
  try {
    console.log('=== Testing database connection ===')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Check if nation 701263 already exists
    console.log('=== Checking existing data ===')
    const existingNation = await prisma.nation.findUnique({ where: { id: 701263 } })
    console.log('Existing nation 701263:', existingNation)
    
    // Check if alliance 790 already exists
    const existingAlliance = await prisma.alliance.findUnique({ where: { id: 790 } })
    console.log('Existing alliance 790:', existingAlliance)
    
    // Check for any user with this nation ID
    const existingUser = await prisma.user.findFirst({ where: { pwNationId: 701263 } })
    console.log('Existing user with nation 701263:', existingUser)
    
    console.log('=== Testing alliance upsert ===')
    const allianceData = {
      id: 790,
      name: "Rose",
      acronym: "🌹"
    }
    
    const alliance = await prisma.alliance.upsert({
      where: { id: 790 },
      update: {
        name: allianceData.name,
        acronym: allianceData.acronym,
        updatedAt: new Date(),
      },
      create: {
        id: allianceData.id,
        name: allianceData.name,
        acronym: allianceData.acronym,
      },
    })
    console.log('✅ Alliance upsert successful:', alliance.id)
    
    console.log('=== Testing nation upsert ===')
    const nationData = {
      id: 701263,
      nationName: "Profit",
      leaderName: "Azra",
      allianceId: 790,
      discordId: null
    }
    
    const nation = await prisma.nation.upsert({
      where: { id: 701263 },
      update: {
        nationName: nationData.nationName,
        leaderName: nationData.leaderName,
        allianceId: nationData.allianceId,
        discordId: nationData.discordId,
        updatedAt: new Date(),
      },
      create: {
        id: nationData.id,
        nationName: nationData.nationName,
        leaderName: nationData.leaderName,
        allianceId: nationData.allianceId,
        discordId: nationData.discordId,
      },
    })
    console.log('✅ Nation upsert successful:', nation.id)
    
    console.log('=== Test completed successfully ===')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseOperations()
