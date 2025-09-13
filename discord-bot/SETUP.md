# 🤖 Discord Bot Setup Guide

## 📋 Prerequisites

1. **Discord Developer Account**: Create a Discord application at https://discord.com/developers/applications
2. **Railway Account**: Sign up at https://railway.app for bot hosting
3. **Database Access**: Same Neon PostgreSQL database as the webapp

## 🔧 Discord Application Setup

### 1. Create Discord Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "Politics & War Alliance Bot" (or similar)
4. Save the Application ID (this will be your `DISCORD_CLIENT_ID`)

### 2. Create Bot User
1. In your Discord application, go to "Bot" section
2. Click "Add Bot"
3. Copy the Bot Token (this will be your `DISCORD_BOT_TOKEN`)
4. Enable the following bot permissions:
   - Send Messages
   - Use Slash Commands
   - Manage Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use External Emojis

### 3. OAuth2 Setup
1. Go to "OAuth2" > "General"
2. Add your redirect URIs:
   - `http://localhost:3000/auth/callback/discord` (development)
   - `https://your-webapp-domain.vercel.app/auth/callback/discord` (production)
3. Copy the Client Secret (this will be your `DISCORD_CLIENT_SECRET`)

## 🌐 Environment Configuration

### Discord Bot (.env)
Create `discord-bot/.env` file with:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Database (same as webapp)
DATABASE_URL=your_neon_database_url_here

# Webapp Integration
WEBAPP_API_URL=https://your-webapp.vercel.app
WEBAPP_BOT_SECRET=your_shared_secret_here

# Server Configuration
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Multi-tenant Encryption
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### Webapp (.env.local updates)
Add to your webapp environment:

```env
# Discord Bot Integration
DISCORD_BOT_API_URL=https://your-bot.railway.app
WEBAPP_BOT_SECRET=your_shared_secret_here
```

## 🚀 Local Development

### 1. Start the Discord Bot
```bash
cd discord-bot
npm run dev
```

### 2. Start the Webapp
```bash
cd webapp
npm run dev
```

### 3. Test Connection
1. Navigate to `http://localhost:3000/7452/modules/bot-management`
2. Click "Test Connection" on any server card
3. Verify successful communication between webapp and bot

## 🚂 Railway Deployment

### 1. Prepare for Deployment
```bash
cd discord-bot
npm run build
```

### 2. Deploy to Railway
1. Connect your GitHub repository to Railway
2. Create a new project from the `discord-bot` directory
3. Set all environment variables in Railway dashboard
4. Deploy automatically on push to main branch

### 3. Configure Webhooks (Optional)
Set up Railway webhooks for deployment notifications:
- Discord webhook URL for deployment status
- Slack integration for monitoring

## 🔗 Bot Invitation Process

### 1. From Webapp
1. Go to Bot Management section in webapp
2. View "Available Discord Servers" (requires Discord OAuth)
3. Click "Invite Bot" for desired servers
4. Complete Discord authorization flow
5. Verify bot appears in server member list

### 2. Manual Invitation
Generate invite URL with this format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=277025770560&scope=bot%20applications.commands&guild_id=YOUR_SERVER_ID
```

## 🛠️ Bot Commands

Once invited, your bot supports:

- `/ping` - Test bot responsiveness
- `/test-webapp` - Test connection to alliance webapp
- More commands coming soon...

## 🔧 Troubleshooting

### Bot Not Responding
1. Check Railway logs: `railway logs`
2. Verify Discord token is valid
3. Ensure bot has required permissions in Discord server
4. Check database connectivity

### Webapp Communication Issues
1. Verify `DISCORD_BOT_API_URL` in webapp environment
2. Check shared secret matches between webapp and bot
3. Test API endpoints directly: `GET https://your-bot.railway.app/health`

### Permission Errors
1. Ensure bot has administrator permissions in Discord server
2. Check Discord OAuth scopes include "guilds"
3. Verify user has admin permissions in target Discord server

## 📊 Monitoring

### Health Checks
- Bot health: `GET https://your-bot.railway.app/health`
- Webapp integration: Use "Test Connection" in Bot Management

### Logs
- Railway provides comprehensive logging
- Local development: Check console output
- Production: Monitor Railway dashboard

## 🔒 Security Considerations

1. **Environment Variables**: Never commit tokens or secrets
2. **Permissions**: Use least-privilege principle for bot permissions
3. **Rate Limiting**: Discord API has strict rate limits
4. **Data Isolation**: Each Discord server operates independently

## 📝 Next Steps

1. **Deploy to Railway**: Get the bot online
2. **Invite to Servers**: Add bot to your alliance Discord servers
3. **Test Functionality**: Verify all commands work
4. **Monitor Performance**: Check logs and health status
5. **Add Commands**: Expand bot functionality as needed

## 💡 Development Tips

- Use `npm run dev` for hot reload during development
- Test all commands in a private Discord server first
- Monitor Railway metrics for performance optimization
- Use Discord.js documentation for advanced features

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway and Discord logs
3. Verify all environment variables are set correctly
4. Test API endpoints manually

---

**Ready to launch your Politics & War Alliance Discord Bot!** 🚀