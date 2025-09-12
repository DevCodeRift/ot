// Fix Discord ID mismatch
// Run with: node fix-discord-mismatch.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDiscordMismatch() {
  console.log('🔧 Fixing Discord ID mismatches...\n')
  
  try {
    // Find accounts with Discord connections where user.discordId is null
    const mismatchedAccounts = await prisma.account.findMany({
      where: {
        provider: 'discord',
        user: {
          discordId: null
        }
      },
      include: {
        user: true
      }
    })

    console.log(`Found ${mismatchedAccounts.length} mismatched Discord accounts`)

    for (const account of mismatchedAccounts) {
      console.log(`\nFixing user ${account.userId}:`)
      console.log(`  Setting discordId to: ${account.providerAccountId}`)
      
      try {
        await prisma.user.update({
          where: { id: account.userId },
          data: {
            discordId: account.providerAccountId,
            discordUsername: account.user.name || `Discord User (${account.providerAccountId})`
          }
        })
        console.log(`  ✅ Successfully updated user ${account.userId}`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`  ❌ Discord ID ${account.providerAccountId} is already taken by another user`)
          
          // Find the conflicting user
          const conflictingUser = await prisma.user.findUnique({
            where: { discordId: account.providerAccountId }
          })
          
          if (conflictingUser) {
            console.log(`  Conflicting user ID: ${conflictingUser.id}`)
            console.log(`  You need to manually resolve this conflict`)
          }
        } else {
          console.log(`  ❌ Error updating user: ${error.message}`)
        }
      }
    }

    console.log('\n✅ Discord mismatch fix completed')

  } catch (error) {
    console.error('Error fixing Discord mismatches:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDiscordMismatch()
