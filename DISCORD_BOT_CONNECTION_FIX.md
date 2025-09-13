# Discord Bot Setup and Role Sync Guide

## Current Issue
The Discord bot is not running, so role sync fails with connection errors. The webapp is trying to connect to the Discord bot but getting "ECONNREFUSED" errors.

## Quick Fix Steps

### 1. Start the Discord Bot

First, make sure you have the Discord bot environment configured:

```bash
# Go to Discord bot directory
cd discord-bot

# Copy environment example if you don't have .env
cp .env.example .env

# Edit .env file and set these variables:
# DISCORD_BOT_TOKEN=your_actual_bot_token
# DATABASE_URL=your_database_url (same as webapp)
# WEBAPP_BOT_SECRET=same_secret_as_webapp
# PORT=8080
```

Then start the bot:
```bash
npm run dev
# or
npm start
```

### 2. Verify Bot Connection

Test if the bot is running:
```bash
curl http://localhost:8080/health
```

Should return:
```json
{
  "status": "ok",
  "bot": "connected",
  "timestamp": "2025-09-13T17:20:00.000Z"
}
```

### 3. Set Webapp Environment

In your webapp's `.env.local`, make sure you have:
```bash
DISCORD_BOT_URL="http://localhost:8080"
WEBAPP_BOT_SECRET="your_secure_secret_for_bot_communication"
```

### 4. Test Role Sync

Once the bot is running:
1. Go to your role management page: `https://orbistech.dev/790/alliance/roles`
2. Look for roles with yellow dots (unsynced)
3. Click the individual 🔄 sync button on each role
4. Should now succeed instead of showing connection errors

## Environment Variable Summary

### Webapp (.env.local)
```bash
# Discord Bot Communication
DISCORD_BOT_URL="http://localhost:8080"
WEBAPP_BOT_SECRET="matching-secret-123"
```

### Discord Bot (.env)
```bash
# Discord Configuration
DISCORD_BOT_TOKEN="your.discord.bot.token.here"
PORT=8080

# Database (same as webapp)
DATABASE_URL="postgresql://your_database_url"

# Webapp Communication
WEBAPP_BOT_SECRET="matching-secret-123"
```

## Troubleshooting

### Connection Errors
- ✅ **Fixed**: Better error messages when bot is offline
- ✅ **Status 503**: "Discord bot is not running" instead of generic error
- ✅ **URL shown**: Error message includes the bot URL being attempted

### Individual vs Bulk Sync
- **Individual Sync**: Click 🔄 on each role card (recommended)
- **Bulk Sync**: "Sync to Discord" button (may overwhelm bot)

### Port Configuration
- **Default**: Port 8080 (updated from 3001)
- **Configurable**: Set `PORT=` in bot's .env
- **Webapp**: Set `DISCORD_BOT_URL=` in webapp's .env.local

## Error Messages Now Show

Instead of generic "Internal server error", you'll now see:

```json
{
  "error": "Discord bot is not running",
  "details": "Cannot connect to Discord bot at http://localhost:8080. Please ensure the Discord bot is running.",
  "botUrl": "http://localhost:8080"
}
```

This makes it clear what needs to be fixed!

## Next Steps

1. **Start Discord bot** on port 8080
2. **Test individual role sync** instead of bulk
3. **Check bot permissions** in Discord server
4. **Verify bot has ManageRoles permission**

The role sync feature is ready to work as soon as the Discord bot is running properly! 🚀