import { Events, Client } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`[BOT READY] ${client.user?.tag} is online!`);
    console.log(`[BOT READY] Connected to ${client.guilds.cache.size} guilds:`);
    
    client.guilds.cache.forEach(guild => {
      console.log(`[BOT READY] - ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
      
      // Log if this is our target guild
      if (guild.id === '1407812256636469470') {
        console.log(`[BOT READY] ✅ Found target Discord server for alliance 790`);
        console.log(`[BOT READY] Bot permissions in ${guild.name}:`, guild.members.me?.permissions.toArray().join(', '));
      }
    });
    
    // Log intents to verify configuration
    console.log(`[BOT READY] Bot intents:`, client.options.intents);
  }
};