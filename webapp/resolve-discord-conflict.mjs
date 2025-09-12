// Investigate and resolve Discord ID conflict
// Run with: node resolve-discord-conflict.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resolveDiscordConflict() {
  console.log('🔍 Investigating Discord ID conflict...\n')
  
  const conflictingDiscordId = '469629016421171252'
  
  try {
    // Get all users with this Discord ID
    const usersWithSameDiscordId = await prisma.user.findMany({
      where: {
        discordId: conflictingDiscordId
      },
      include: {
        accounts: true,
        sessions: true
      }
    })

    // Get the account that should be linked to this Discord ID
    const discordAccount = await prisma.account.findFirst({
      where: {
        provider: 'discord',
        providerAccountId: conflictingDiscordId
      },
      include: {
        user: true
      }
    })

    console.log('Users with Discord ID', conflictingDiscordId, ':')
    usersWithSameDiscordId.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Discord Username: ${user.discordUsername}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log(`   Accounts: ${user.accounts.length}`)
      console.log(`   Sessions: ${user.sessions.length}`)
      console.log(`   Has P&W API Key: ${user.pwApiKey ? 'Yes' : 'No'}`)
      console.log(`   Current Alliance ID: ${user.currentAllianceId}`)
    })

    if (discordAccount) {
      console.log(`\nDiscord account is linked to user: ${discordAccount.userId}`)
      console.log(`Account user name: ${discordAccount.user.name}`)
      console.log(`Account user email: ${discordAccount.user.email}`)
    }

    // Determine which user to keep
    console.log('\n🔧 Recommended action:')
    
    if (discordAccount) {
      const correctUser = discordAccount.user
      const duplicateUsers = usersWithSameDiscordId.filter(u => u.id !== correctUser.id)
      
      if (duplicateUsers.length > 0) {
        console.log(`Keep user ${correctUser.id} (has the Discord account connection)`)
        console.log('Remove Discord ID from these duplicate users:')
        duplicateUsers.forEach(user => {
          console.log(`- User ${user.id}: ${user.name || user.email || 'No name/email'}`)
        })

        // Automatically fix this
        console.log('\n🔧 Automatically fixing the conflict...')
        
        for (const user of duplicateUsers) {
          console.log(`Removing Discord ID from user ${user.id}`)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              discordId: null,
              discordUsername: null
            }
          })
          console.log(`✅ Cleared Discord ID from user ${user.id}`)
        }

        // Now update the correct user
        console.log(`\nUpdating correct user ${correctUser.id} with Discord ID`)
        await prisma.user.update({
          where: { id: correctUser.id },
          data: {
            discordId: conflictingDiscordId,
            discordUsername: correctUser.name || `Discord User (${conflictingDiscordId})`
          }
        })
        console.log(`✅ Updated user ${correctUser.id} with Discord ID`)

        console.log('\n✅ Conflict resolved successfully!')
      } else {
        console.log('No duplicates found - conflict may already be resolved')
      }
    } else {
      console.log('❌ Could not find the Discord account connection')
    }

  } catch (error) {
    console.error('Error resolving Discord conflict:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resolveDiscordConflict()
