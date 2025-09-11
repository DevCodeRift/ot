#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Politics & War Alliance Management Platform...\n');

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.log('❌ .env.local file not found!');
  console.log('Please copy .env.example to .env.local and fill in your values.\n');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n🗄️  Generating Prisma client...');
  execSync('npm run db:generate', { stdio: 'inherit' });

  console.log('\n🔄 Pushing database schema...');
  try {
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.log('\n⚠️  Database setup failed. Please check your DATABASE_URL in .env.local');
    console.log('Make sure your database is accessible and the connection string is correct.\n');
  }

  console.log('\n🎉 Setup complete! You can now run:');
  console.log('   npm run dev');
  console.log('\nThen visit http://localhost:3000 to see your application!\n');

  console.log('📋 Don\'t forget to:');
  console.log('   1. Add your Discord OAuth redirect URL: http://localhost:3000/api/auth/callback/discord');
  console.log('   2. Get your Politics & War API key from https://politicsandwar.com/account/');
  console.log('   3. Add your Discord user ID to ADMIN_DISCORD_IDS in .env.local\n');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
