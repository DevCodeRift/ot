import { Events } from 'discord.js';

export default {
  name: Events.Debug,
  execute(info: string) {
    // Only log relevant debug info to avoid spam
    if (info.includes('member') || info.includes('role') || info.includes('guild')) {
      console.log(`[DISCORD DEBUG] ${info}`);
    }
  }
};