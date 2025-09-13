import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  responseTime?: number
  lastChecked: string
  details?: string
  uptime?: string
}

async function checkWebAppHealth(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    // Check if we can connect to the database
    await prisma.user.count()
    const responseTime = Date.now() - start
    
    return {
      name: 'webapp',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: responseTime < 1000 ? 'All systems operational' : 'Response time elevated',
      uptime: process.uptime() ? `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m` : 'Unknown'
    }
  } catch (error) {
    return {
      name: 'webapp',
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkDiscordBotHealth(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    // Check if we can reach the Discord bot
    const botUrl = process.env.DISCORD_BOT_URL || 'http://localhost:3001'
    const response = await fetch(`${botUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const responseTime = Date.now() - start

    if (response.ok) {
      const botStatus = await response.json()
      return {
        name: 'discordBot',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `Bot online. ${botStatus.serverCount || 0} servers connected`,
        uptime: botStatus.uptime || 'Unknown'
      }
    } else {
      throw new Error(`Bot responded with ${response.status}`)
    }
  } catch (error) {
    return {
      name: 'discordBot',
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `Error: ${error instanceof Error ? error.message : 'Connection failed'}`
    }
  }
}

async function checkDatabaseHealth(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    const userCount = await prisma.user.count()
    const serverCount = await prisma.discordServer.count()
    const responseTime = Date.now() - start

    return {
      name: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Connected. ${userCount} users, ${serverCount} servers registered`,
      uptime: 'Connected'
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkPWApiHealth(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    // Simple test - try to fetch nations endpoint with a small limit
    const response = await fetch('https://politicsandwar.com/api/nations/?first=1', {
      headers: {
        'X-Bot-Key': process.env.POLITICS_AND_WAR_API_KEY || ''
      },
      signal: AbortSignal.timeout(10000)
    })

    const responseTime = Date.now() - start

    if (response.ok) {
      return {
        name: 'pwApi',
        status: responseTime < 3000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: 'API accessible',
        uptime: 'Available'
      }
    } else {
      throw new Error(`API responded with ${response.status}`)
    }
  } catch (error) {
    return {
      name: 'pwApi',
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `Error: ${error instanceof Error ? error.message : 'Connection failed'}`
    }
  }
}

async function checkModuleHealth(moduleName: string, allianceId?: number): Promise<HealthCheck> {
  try {
    // Check if the module is enabled for the alliance
    let isEnabled = false
    
    if (allianceId) {
      const moduleAccess = await prisma.allianceModule.findFirst({
        where: {
          allianceId,
          moduleId: moduleName,
          enabled: true
        }
      })
      isEnabled = !!moduleAccess
    }

    return {
      name: moduleName,
      status: isEnabled ? 'healthy' : 'unknown',
      lastChecked: new Date().toISOString(),
      details: isEnabled ? 'Module enabled and accessible' : 'Module not enabled or alliance not specified',
      uptime: isEnabled ? 'Available' : 'Disabled'
    }
  } catch (error) {
    return {
      name: moduleName,
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for bot authentication
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.WEBAPP_BOT_SECRET}`
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const allianceId = searchParams.get('allianceId')
    const allianceIdNum = allianceId ? parseInt(allianceId) : undefined

    // Perform all health checks in parallel
    const [webapp, discordBot, database, pwApi, ...moduleChecks] = await Promise.all([
      checkWebAppHealth(),
      checkDiscordBotHealth(),
      checkDatabaseHealth(),
      checkPWApiHealth(),
      checkModuleHealth('war', allianceIdNum),
      checkModuleHealth('economic', allianceIdNum),
      checkModuleHealth('membership', allianceIdNum),
      checkModuleHealth('bot-management', allianceIdNum),
      checkModuleHealth('quests', allianceIdNum)
    ])

    const [war, economic, membership, botManagement, quests] = moduleChecks

    const now = new Date()
    const nextUpdate = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now

    const systemStatus = {
      webapp,
      discordBot,
      database,
      pwApi,
      modules: {
        war,
        economic,
        membership,
        botManagement,
        quests
      },
      lastUpdate: now.toISOString(),
      nextUpdate: nextUpdate.toISOString(),
      allianceId: allianceIdNum
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error('Error checking system status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}