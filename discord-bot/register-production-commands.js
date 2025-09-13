/**
 * Production command registration script
 * This should be run ONCE after deploying to Railway with real credentials
 */

import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';

// Load Railway environment variables (or local for testing)
dotenv.config();

async function registerProductionCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error('❌ Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID');
    console.log('ℹ️  These should be set in Railway environment variables');
    process.exit(1);
  }

  // Command definitions
  const commands = [
    {
      name: 'ping',
      description: 'Test if the bot is responsive',
      type: 1
    },
    {
      name: 'setup-status-channel',
      description: 'Configure which channel receives automated status updates',
      type: 1,
      default_member_permissions: '16', // Administrator permission
      options: [
        {
          name: 'channel',
          description: 'Channel to receive status updates',
          type: 7, // Channel type
          channel_types: [0], // Text channel
          required: true
        },
        {
          name: 'enable',
          description: 'Enable or disable status updates',
          type: 5, // Boolean type
          required: false
        }
      ]
    },
    {
      name: 'status',
      description: 'Show current system status',
      type: 1
    },
    {
      name: 'test-webapp',
      description: 'Test connection between Discord bot and webapp',
      type: 1
    }
  ];

  const rest = new REST().setToken(token);

  try {
    console.log('🚀 Starting to refresh application (/) commands...');
    console.log(`📊 Registering ${commands.length} commands globally...`);

    // Register commands globally (available in all servers)
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    console.log('');
    console.log('🎉 Commands should now be available in Discord!');
    console.log('💡 If you don\'t see them immediately:');
    console.log('   1. Try refreshing Discord (Ctrl+R)');
    console.log('   2. Wait up to 1 hour for global commands to propagate');
    console.log('   3. Check bot permissions in your server');
    
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    
    if (error.status === 401) {
      console.log('');
      console.log('🔐 Authentication failed. Check:');
      console.log('   - DISCORD_BOT_TOKEN is correct');
      console.log('   - Bot token has not been regenerated');
      console.log('   - Environment variables are set in Railway');
    }
  }
}

// Run if called directly
if (require.main === module) {
  registerProductionCommands();
}

export { registerProductionCommands };