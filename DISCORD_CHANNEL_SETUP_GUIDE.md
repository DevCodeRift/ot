# Discord Status Channel Setup Guide

## Overview
The Discord status monitoring system allows you to automatically receive system status updates in your Discord server every 30 minutes. This guide explains how to configure which channel receives these updates.

## 🚀 Quick Setup (For Discord Server Admins)

### Method 1: Using Discord Slash Commands (Recommended)

1. **Run the setup command in your Discord server:**
   ```
   /setup-status-channel channel:#your-status-channel enable:true
   ```

2. **Select your desired channel:**
   - Choose any text channel where you want status updates
   - Common choices: `#status`, `#system-status`, `#announcements`, `#updates`

3. **Verify configuration:**
   ```
   /status
   ```
   This command shows the current system status and confirms your setup.

### Method 2: Auto-Detection (Fallback)

If you don't configure a specific channel, the bot will automatically look for channels with these names:
- `status`
- `system-status` 
- `monitoring`
- `announcements`
- `updates`
- `general` (as last resort)

## 🔧 Configuration Details

### Required Permissions

**For the User Setting Up:**
- "Manage Channels" permission in the Discord server

**For the Bot:**
- "Send Messages" permission in the target channel
- "Embed Links" permission (for rich status embeds)
- "View Channel" permission

### Status Update Features

**Automated Updates:**
- ⏰ Published every 30 minutes automatically
- 🟢🟡🔴 Color-coded status indicators
- 📊 Comprehensive system health overview
- 🚨 Immediate alerts for critical issues

**Manual Updates:**
- Use `/status` command anytime for current status
- Admins can trigger updates from the webapp

## 🎛️ Advanced Configuration (For System Admins)

### Webapp Admin Interface

System administrators can view and manage all Discord server configurations:

1. **Navigate to Admin Panel:**
   - Go to `/admin/discord-servers` in the webapp
   - View all connected Discord servers
   - See which servers have status channels configured

2. **Configuration Overview:**
   - ✅ Green checkmark: Status channel configured
   - ⚠️ Yellow warning: Not configured (uses auto-detection)
   - 🔴 Red indicator: Server inactive

### Database Configuration

For advanced users, status channels are stored in the `channel_configs` table:

```sql
-- View current configurations
SELECT 
    ds.name as server_name,
    cc.channel_id,
    cc.is_active,
    cc.settings->'channelName' as channel_name
FROM discord_servers ds
LEFT JOIN channel_configs cc ON ds.id = cc.server_id
WHERE cc.module = 'system-monitoring' 
  AND cc.event_type = 'status-updates';
```

## 📋 Command Reference

### Discord Bot Commands

| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `/setup-status-channel` | Configure status channel | Manage Channels |
| `/status` | Show current system status | None |
| `/setup-status-channel enable:false` | Disable status updates | Manage Channels |

### Command Examples

**Basic Setup:**
```
/setup-status-channel channel:#status
```

**Enable with specific settings:**
```
/setup-status-channel channel:#system-updates enable:true
```

**Disable status updates:**
```
/setup-status-channel channel:#status enable:false
```

## 🔍 Troubleshooting

### Common Issues

**1. Bot not responding to commands:**
- Verify bot has proper permissions
- Check if bot is online in server member list
- Ensure bot role is above configured channels in role hierarchy

**2. Status updates not appearing:**
- Check channel permissions for the bot
- Verify channel is configured correctly with `/status`
- Look for error messages in bot logs

**3. Auto-detection not working:**
- Create a channel with one of the recognized names
- Or use `/setup-status-channel` to configure explicitly
- Check that bot can see and send messages to the channel

### Getting Help

**Check Current Configuration:**
```
/status
```
This shows current system status and indicates if status channel is configured.

**For System Administrators:**
- Check `/admin/discord-servers` in the webapp
- Review bot logs for error messages
- Verify database channel configurations

## 📊 Status Update Content

### What You'll See in Status Updates

**Overall Health Summary:**
- 🟢 Healthy components count
- 🟡 Degraded components count  
- 🔴 Down components count

**Core Infrastructure Status:**
- Webapp (Next.js application)
- Discord Bot (this bot)
- Database (PostgreSQL)
- P&W API (Politics & War API)

**Module Status:**
- War Management
- Economic Tools
- Membership Management
- Bot Management
- Quest System

**Additional Info:**
- Next update timestamp
- Response times for services
- Uptime information

## 🔄 Update Schedule

**Automated Schedule:**
- Every 30 minutes during normal operation
- Immediate alerts for critical issues
- Manual updates available via commands

**Critical Alerts:**
- Sent immediately when core systems go down
- Separate from regular 30-minute updates
- Higher priority notifications

## 💡 Best Practices

### Channel Setup Recommendations

1. **Dedicated Status Channel:**
   - Create a dedicated `#status` or `#system-status` channel
   - Set appropriate permissions (read-only for members)
   - Pin important status information

2. **Permission Management:**
   - Bot needs minimal permissions (Send Messages, Embed Links)
   - Consider restricting who can use setup commands
   - Regular members only need to see status updates

3. **Integration with Other Tools:**
   - Status updates complement existing monitoring
   - Use alongside webhook notifications if desired
   - Consider muting channel for non-critical updates

### Alliance Coordination

- Configure status channels consistently across alliance Discord servers
- Coordinate with alliance leadership on notification preferences
- Use alliance-specific settings in the webapp admin panel

This setup ensures your Discord community stays informed about system health with minimal configuration effort!