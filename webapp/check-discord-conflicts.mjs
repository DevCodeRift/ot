// Check for Discord ID conflicts in the database
// Run with: node check-discord-conflicts.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDiscordConflicts() {
  console.log('🔍 Checking for Discord ID conflicts...\n')
  
  try {
    // Get all users with Discord IDs
    const usersWithDiscord = await prisma.user.findMany({
      where: {
        discordId: { not: null }
      },
      select: {
        id: true,
        discordId: true,
        discordUsername: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`Found ${usersWithDiscord.length} users with Discord IDs:`)
    usersWithDiscord.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`)
      console.log(`   Discord ID: ${user.discordId}`)
      console.log(`   Discord Username: ${user.discordUsername}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log('')
    })

    // Check for duplicate Discord IDs
    const discordIds = usersWithDiscord.map(u => u.discordId)
    const duplicates = discordIds.filter((id, index) => discordIds.indexOf(id) !== index)
    
    if (duplicates.length > 0) {
      console.log('❌ DUPLICATE DISCORD IDs FOUND:')
      const uniqueDuplicates = [...new Set(duplicates)]
      
      for (const duplicateId of uniqueDuplicates) {
        const conflictingUsers = usersWithDiscord.filter(u => u.discordId === duplicateId)
        console.log(`\nDiscord ID ${duplicateId} is used by ${conflictingUsers.length} users:`)
        conflictingUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. User ID: ${user.id} (${user.discordUsername || 'No username'})`)
        })
      }
      
      console.log('\n🔧 To fix this, you need to:')
      console.log('1. Decide which user should keep each Discord ID')
      console.log('2. Set the discordId to null for the other users')
      console.log('3. Re-link those users through Discord OAuth')
      
    } else {
      console.log('✅ No duplicate Discord IDs found')
    }

    // Check accounts table for Discord connections
    const discordAccounts = await prisma.account.findMany({
      where: {
        provider: 'discord'
      },
      select: {
        userId: true,
        providerAccountId: true,
        user: {
          select: {
            id: true,
            discordId: true,
            discordUsername: true
          }
        }
      }
    })

    console.log(`\n📋 Found ${discordAccounts.length} Discord account connections:`)
    discordAccounts.forEach((account, index) => {
      const mismatch = account.user.discordId !== account.providerAccountId
      console.log(`${index + 1}. User ID: ${account.userId}`)
      console.log(`   Account Discord ID: ${account.providerAccountId}`)
      console.log(`   User Discord ID: ${account.user.discordId}`)
      if (mismatch) {
        console.log(`   ⚠️  MISMATCH DETECTED!`)
      }
      console.log('')
    })

  } catch (error) {
    console.error('Error checking Discord conflicts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDiscordConflicts()
