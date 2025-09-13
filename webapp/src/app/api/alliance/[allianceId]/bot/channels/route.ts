import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const channelConfigSchema = z.object({
  module: z.string(),
  eventType: z.string(),
  channelId: z.string(),
  isActive: z.boolean().optional().default(true),
  settings: z.record(z.string(), z.any()).optional()
});

const updateChannelConfigSchema = z.object({
  serverId: z.string(),
  configs: z.array(channelConfigSchema)
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ allianceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { allianceId: allianceIdParam } = await params;
    const allianceId = parseInt(allianceIdParam);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin of this alliance
    const userAlliance = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        currentAllianceId: allianceId
      },
      include: {
        allianceAdminRoles: {
          where: { allianceId: allianceId }
        }
      }
    });

    if (!userAlliance || userAlliance.allianceAdminRoles.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get Discord servers for this alliance
    const servers = await prisma.discordServer.findMany({
      where: {
        allianceId: allianceId,
        isActive: true
      }
    });

    // Get channel configs for each server
    const serversWithConfigs = await Promise.all(
      servers.map(async (server) => {
        const channelConfigs = await prisma.channelConfig.findMany({
          where: {
            serverId: server.id
          },
          orderBy: [
            { module: 'asc' },
            { eventType: 'asc' }
          ]
        });
        
        return {
          ...server,
          channelConfigs
        };
      })
    );

    return NextResponse.json({ servers: serversWithConfigs });

  } catch (error) {
    console.error('Error fetching channel configs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ allianceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { allianceId: allianceIdParam } = await params;
    const allianceId = parseInt(allianceIdParam);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin of this alliance
    const userAlliance = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        currentAllianceId: allianceId
      },
      include: {
        allianceAdminRoles: {
          where: { allianceId: allianceId }
        }
      }
    });

    if (!userAlliance || userAlliance.allianceAdminRoles.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { serverId, configs } = updateChannelConfigSchema.parse(body);

    // Verify the server belongs to this alliance
    const server = await prisma.discordServer.findFirst({
      where: {
        id: serverId,
        allianceId: allianceId
      }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found or not accessible' }, { status: 404 });
    }

    // Use transaction to update all configs
    await prisma.$transaction(async (tx) => {
      // Delete existing configs for the modules being updated
      const modulesToUpdate = [...new Set(configs.map(c => c.module))];
      await tx.channelConfig.deleteMany({
        where: {
          serverId: serverId,
          module: {
            in: modulesToUpdate
          }
        }
      });

      // Create new configs
      for (const config of configs) {
        await tx.channelConfig.create({
          data: {
            serverId: serverId,
            module: config.module,
            eventType: config.eventType,
            channelId: config.channelId,
            isActive: config.isActive,
            settings: config.settings || {}
          }
        });
      }
    });

    // Log the configuration change
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CHANNEL_CONFIG',
        resource: 'DiscordServer',
        resourceId: serverId,
        userId: session.user.id,
        details: {
          allianceId: allianceId,
          configCount: configs.length
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating channel configs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get available Discord channels for a server
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ allianceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { allianceId: allianceIdParam } = await params;
    const allianceId = parseInt(allianceIdParam);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin of this alliance
    const userAlliance = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        currentAllianceId: allianceId
      },
      include: {
        allianceAdminRoles: {
          where: { allianceId: allianceId }
        }
      }
    });

    if (!userAlliance || userAlliance.allianceAdminRoles.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { serverId } = await request.json();

    // Verify the server belongs to this alliance
    const server = await prisma.discordServer.findFirst({
      where: {
        id: serverId,
        allianceId: allianceId
      }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found or not accessible' }, { status: 404 });
    }

    // Make a request to the Discord bot to get available channels
    const botResponse = await fetch(`${process.env.DISCORD_BOT_URL}/api/channels/${serverId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    if (!botResponse.ok) {
      throw new Error('Failed to fetch channels from Discord bot');
    }

    const { channels } = await botResponse.json();

    return NextResponse.json({ channels });

  } catch (error) {
    console.error('Error fetching Discord channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord channels' },
      { status: 500 }
    );
  }
}