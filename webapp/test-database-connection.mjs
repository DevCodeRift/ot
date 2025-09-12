// Test database connection and user creation
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test user table access
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
    // Test account table access
    const accountCount = await prisma.account.count()
    console.log(`✅ Found ${accountCount} accounts in database`)
    
    // Test session table access
    const sessionCount = await prisma.session.count()
    console.log(`✅ Found ${sessionCount} sessions in database`)
    
    console.log('✅ All database tables accessible')
    
  } catch (error) {
    console.error('❌ Database connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()
