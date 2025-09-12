// Test Discord OAuth Configuration
// Run with: node test-discord-oauth.mjs

import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.production' })

console.log('🔍 Testing Discord OAuth Configuration...\n')

// Check required environment variables
const requiredVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET'
]

let allVarsPresent = true
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`❌ Missing: ${varName}`)
    allVarsPresent = false
  } else {
    // Mask sensitive values
    if (varName.includes('SECRET') || varName.includes('CLIENT_SECRET')) {
      console.log(`✅ ${varName}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`)
    } else {
      console.log(`✅ ${varName}: ${value}`)
    }
  }
})

if (!allVarsPresent) {
  console.log('\n❌ Missing required environment variables!')
  process.exit(1)
}

console.log('\n🔧 Configuration Analysis:')

const nextAuthUrl = process.env.NEXTAUTH_URL
const expectedCallbackUrl = `${nextAuthUrl}/api/auth/callback/discord`

console.log(`\n📍 Base URL: ${nextAuthUrl}`)
console.log(`📍 Expected Discord Redirect URI: ${expectedCallbackUrl}`)

console.log('\n📋 Discord Application Setup Checklist:')
console.log('   1. Go to https://discord.com/developers/applications')
console.log(`   2. Select your application (Client ID: ${process.env.DISCORD_CLIENT_ID})`)
console.log('   3. Go to OAuth2 → General')
console.log('   4. Add this EXACT redirect URI:')
console.log(`      ${expectedCallbackUrl}`)
console.log('   5. Ensure OAuth2 → URL Generator has these scopes:')
console.log('      - identify')
console.log('      - email')

// Validate URL format
try {
  new URL(nextAuthUrl)
  console.log('\n✅ NEXTAUTH_URL format is valid')
} catch (error) {
  console.log('\n❌ NEXTAUTH_URL format is invalid:', error.message)
}

// Check if using HTTPS in production
if (nextAuthUrl.includes('orbistech.dev') && !nextAuthUrl.startsWith('https://')) {
  console.log('\n⚠️  WARNING: Production URL should use HTTPS')
}

console.log('\n🔍 Common Issues to Check:')
console.log('   - Discord redirect URI must match EXACTLY (case-sensitive)')
console.log('   - No trailing slashes in URLs')
console.log('   - NEXTAUTH_SECRET must be set and consistent')
console.log('   - Environment variables must be available at runtime')

console.log('\n✅ Configuration check complete!')
