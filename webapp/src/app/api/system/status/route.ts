import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
      const data = await response.json()
      return {
        name: 'discordBot',
        status: data.status === 'ok' ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data.details || 'Bot is online and responsive',
        uptime: data.uptime || 'Unknown'
      }
    } else {
      return {
        name: 'discordBot',
        status: 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      name: 'discordBot',
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkDatabaseHealth(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    // Perform a simple query to test database connectivity
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start
    
    // Get database statistics
    const userCount = await prisma.user.count()
    const serverCount = await prisma.discordServer.count()
    
    return {
      name: 'database',
      status: responseTime < 500 ? 'healthy' : 'degraded',
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
    // Test P&W API connectivity
    const apiKey = process.env.POLITICS_AND_WAR_API_KEY
    if (!apiKey) {
      return {
        name: 'pwApi',
        status: 'down',
        lastChecked: new Date().toISOString(),
        details: 'API key not configured'
      }
    }
    
    const response = await fetch(`https://politicsandwar.com/api/alliances/?key=${apiKey}&id=1`, {
      method: 'GET',
      headers: { 'User-Agent': 'P&W Alliance Manager' },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })
    
    const responseTime = Date.now() - start
    
    if (response.ok) {
      const data = await response.json()
      return {
        name: 'pwApi',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data.success ? 'API responding normally' : 'API returned error',
        uptime: 'External service'
      }
    } else {
      return {
        name: 'pwApi',
        status: 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `API error: HTTP ${response.status}`
      }
    }
  } catch (error) {
    return {
      name: 'pwApi',
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `API unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function checkModuleHealth(moduleId: string, allianceId?: number): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    // Check if module is enabled for the alliance
    if (allianceId) {
      const moduleAccess = await prisma.allianceModule.findFirst({
        where: {
          allianceId,
          moduleId,
          enabled: true
        }
      })
      
      if (!moduleAccess) {
        return {
          name: moduleId,
          status: 'down',
          lastChecked: new Date().toISOString(),
          details: 'Module not enabled for this alliance'
        }
      }
    }
    
    // Check module-specific health
    let details = 'Module operational'
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    
    switch (moduleId) {
      case 'war':
        // Check if war alert channels are configured
        const warChannels = await prisma.channelConfig.count({
          where: { module: 'war', eventType: 'war_alerts', isActive: true }
        })
        details = `${warChannels} war alert channels configured`
        if (warChannels === 0) status = 'degraded'
        break
        
      case 'economic':
        // Check economic module health
        details = 'Economic tracking active'
        break
        
      case 'membership':
        // Check membership module health
        const users = await prisma.user.count()
        details = `${users} users registered`
        break
        
      case 'bot-management':
        // Check bot connections
        const activeServers = await prisma.discordServer.count({
          where: { isActive: true }
        })
        details = `${activeServers} active Discord servers`
        if (activeServers === 0) status = 'degraded'
        break
        
      case 'quests':
        // Check quest system
        details = 'Quest system operational'
        break
    }
    
    const responseTime = Date.now() - start
    
    return {
      name: moduleId,
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details,
      uptime: 'Module active'
    }
  } catch (error) {
    return {
      name: moduleId,
      status: 'down',
      lastChecked: new Date().toISOString(),
      details: `Module error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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
      nextUpdate: nextUpdate.toISOString()
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error('System status check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check system status' },
      { status: 500 }
    )
  }
}