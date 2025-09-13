# Railway Deployment Guide - Discord Bot

## Pre-Deployment Checklist ✅

The Discord bot is **ready for Railway deployment** via GitHub. Here's what's been prepared:

### 🔐 Security & Environment
- ✅ `.env` files are properly excluded via `.gitignore`
- ✅ `.env.example` provided with all required variables
- ✅ No sensitive data in source code
- ✅ Multi-tenant architecture with data isolation

### 🚀 Railway Configuration
- ✅ `Dockerfile` optimized for production deployment
- ✅ `railway.json` configured with proper settings
- ✅ Health checks implemented
- ✅ Non-root user for security
- ✅ Production-ready build process

### 🏗️ Project Structure
- ✅ TypeScript compilation working
- ✅ Discord.js v14 with slash commands
- ✅ Express API server for webapp communication
- ✅ Prisma client for database access
- ✅ Winston logging configured
- ✅ Error handling and recovery

## Required Environment Variables for Railway

When deploying to Railway, you'll need to set these environment variables in the Railway dashboard:

### 🤖 Discord Bot Credentials
```bash
DISCORD_BOT_TOKEN=your_actual_bot_token_from_discord_developer_portal
DISCORD_CLIENT_ID=your_bot_application_id
DISCORD_CLIENT_SECRET=your_bot_client_secret
```

### 🗄️ Database Connection
```bash
DATABASE_URL=your_neon_postgresql_url_from_webapp
```
*Use the same DATABASE_URL from your webapp's Vercel environment*

### 🌐 Webapp Integration
```bash
WEBAPP_API_URL=https://your-webapp-domain.vercel.app
WEBAPP_BOT_SECRET=generate_a_secure_random_string_for_api_auth
```

### ⚙️ Bot Configuration
```bash
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
ENCRYPTION_KEY=generate_32_character_key_for_server_data_encryption
```

## Deployment Steps

1. **Push to GitHub**: The discord-bot directory is ready to be committed and pushed
2. **Connect Railway**: Link your GitHub repository to Railway
3. **Set Environment Variables**: Add all the variables listed above in Railway dashboard
4. **Deploy**: Railway will automatically build and deploy using the Dockerfile

## Post-Deployment

After successful deployment, you'll need to:
1. Update your webapp's `WEBAPP_API_URL` environment variable to point to the Railway bot URL
2. Test the bot invite functionality in your webapp's Bot Management section
3. Configure your Discord application's interactions endpoint URL in Discord Developer Portal

## Discord Developer Portal Setup

You'll need to create a Discord application and bot:
1. Go to https://discord.com/developers/applications
2. Create new application
3. Go to "Bot" section and create bot
4. Copy the bot token for `DISCORD_BOT_TOKEN`
5. Get the Application ID for `DISCORD_CLIENT_ID`
6. Go to "OAuth2" section and copy client secret for `DISCORD_CLIENT_SECRET`

The bot is fully prepared and ready for Railway deployment! 🚀