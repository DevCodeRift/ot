# War Alerts Configuration - User Guide

## 🎯 Where to Find War Alerts Configuration

The war alert configuration for Discord notifications is now integrated into the **War Management** module.

### Navigation Steps:

1. **Go to War Management Module**
   ```
   [Your Alliance] → Modules → War Management
   ```

2. **Select War Alerts Tab**
   - You'll see two tabs in the War Management module:
     - 🎯 **Raid Finder** (default) - Find optimal raid targets
     - 🔔 **War Alerts** - Configure Discord war notifications

3. **Configure Discord Channels**
   - Click on the **🔔 War Alerts** tab
   - Select your Discord server from the dropdown
   - Choose which Discord channel should receive war notifications
   - Enable/disable war alerts with the toggle switch
   - Save your configuration

## 🔔 War Alert Features

### **Real-time War Notifications**
- **Offensive Wars**: When your alliance members declare war
- **Defensive Wars**: When your alliance members are attacked
- **Rich Embeds**: Detailed war information with nation links
- **Discord Threads**: Automatic thread creation for war coordination
- **User Mentions**: Direct pings for registered Discord users

### **Enhanced War Data (powered by pnwkit-2.0)**
- War ID with direct links to Politics & War
- War type and reason
- Nation and alliance information for both sides
- Clickable links to view nations and war timelines
- Automatic thread creation for coordination

### **Channel Configuration Options**
- **Module**: War
- **Event Type**: War Alerts
- **Discord Channel**: Select any text channel in your server
- **Status**: Enable/disable notifications per channel

## 🚀 Quick Setup Guide

### Prerequisites:
1. ✅ Alliance must be whitelisted for the War module
2. ✅ Discord server must be connected to the bot
3. ✅ Bot must have appropriate permissions in Discord

### Configuration Steps:

1. **Access War Management**
   ```
   https://your-webapp.com/[allianceId]/modules/war
   ```

2. **Switch to War Alerts Tab**
   - Click the **🔔 War Alerts** tab

3. **Select Discord Server**
   - Choose your Discord server from the dropdown
   - If no servers appear, ensure the bot is invited and connected

4. **Configure War Alert Channel**
   - Toggle **War Alerts** to enabled
   - Select the Discord channel for notifications
   - Click **Save Configuration**

5. **Test Configuration**
   - War alerts will automatically trigger when wars are declared
   - Check Discord channel for real-time notifications

## 📊 What War Alerts Look Like

### **Offensive War Alert Example:**
```
🚨 OFFENSIVE WAR ALERT 🚨

@Username Your nation **YourNation** has declared war on **EnemyNation**!

[Rich Discord Embed with:]
- War ID: #12345 (clickable link)
- War Type: Ordinary War
- Reason: Counter Attack
- Our Nation: YourNation (Leader Name)
- Enemy Nation: EnemyNation (Leader Name)
- Alliance info for both sides

[Automatic Thread Creation:]
"War Alert: YourNation vs EnemyNation"
- Coordination thread for planning
- Quick links to war timeline
- Links to both nations
```

### **Defensive War Alert Example:**
```
🚨 DEFENSIVE WAR ALERT 🚨

@Username Your nation **YourNation** is under attack by **AttackerNation**!

[Rich Discord Embed with:]
- War details and links
- Alliance information
- Thread for defense coordination
```

## 🔧 Technical Implementation

### **Powered by pnwkit-2.0**
- Real-time P&W API subscriptions
- Enhanced error handling and reconnection
- Efficient alliance-specific filtering
- Automatic data enrichment

### **Discord Integration**
- Rich embeds with cyberpunk styling
- Automatic thread creation
- User mention system for registered players
- Channel-specific configuration

### **Multi-Alliance Support**
- Each alliance can configure independently
- Server-specific isolation
- Per-module access control

## 🛟 Troubleshooting

### **War Alerts Not Working?**

1. **Check Module Access**
   - Ensure your alliance is whitelisted for the War module
   - Contact admin if access is needed

2. **Verify Discord Connection**
   - Go to Bot Management module
   - Ensure Discord server is connected
   - Check bot permissions

3. **Confirm Channel Configuration**
   - War Alerts toggle is enabled
   - Valid Discord channel is selected
   - Configuration was saved successfully

4. **Test Bot Connectivity**
   - Use Bot Management → Test Connection
   - Check Railway deployment logs
   - Verify API connectivity

### **No Discord Servers in Dropdown?**
- Invite the bot to your Discord server first
- Use the Bot Management module to connect servers
- Ensure you have admin permissions in Discord

### **Not Receiving User Mentions?**
- Register your Discord account with `/register` command
- Link your P&W nation ID to Discord account
- Check user is properly synced in database

## 📈 Benefits of Integrated War Alerts

✅ **Centralized Configuration**: All war settings in one place
✅ **Real-time Notifications**: Instant Discord alerts for wars
✅ **Rich Information**: Detailed war data with links
✅ **Coordination Tools**: Automatic thread creation
✅ **User-Friendly**: Simple toggle and channel selection
✅ **Scalable**: Supports multiple Discord servers per alliance

---

**📍 Location**: `War Management → War Alerts Tab`
**🔗 Direct URL**: `https://your-webapp.com/[allianceId]/modules/war`
**🎯 Tab**: Click **🔔 War Alerts** after opening War Management