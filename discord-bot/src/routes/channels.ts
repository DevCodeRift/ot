import express = require('express');
import { client } from '../index';

const router = express.Router();

// Get available text channels for a Discord server
router.get('/channels/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.WEBAPP_BOT_SECRET;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the Discord guild
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found or bot not in guild' });
    }

    // Get text channels
    const textChannels = guild.channels.cache
      .filter((channel: any) => channel.type === 0) // TEXT channel type
      .map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        parent: channel.parent?.name || null,
        position: channel.position
      }))
      .sort((a: any, b: any) => a.position - b.position);

    res.json({ 
      channels: textChannels,
      guildName: guild.name
    });

  } catch (error) {
    console.error('Error fetching Discord channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;