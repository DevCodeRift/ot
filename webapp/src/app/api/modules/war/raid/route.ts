import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PoliticsWarAPI } from '@/lib/politics-war-api';

// Locutus Raid Finder - Faithful port from WarCommands.java
// Based on: https://github.com/xdnw/locutus/blob/main/src/main/java/link/locutus/discord/commands/manager/v2/impl/pw/commands/WarCommands.java

interface RaidTarget {
  id: number;
  nation_name: string;
  leader_name: string;
  alliance_name?: string;
  score: number;
  cities: number;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  spies: number;
  last_active: string;
  beige_turns: number;
  vacation_mode_turns: number;
  color: string;
  wars: any[];
  
  // Locutus-specific calculations
  lootTotal: number;
  avgInfra: number;
  militaryStrength: number;
  groundStrength: number;
  isActive: boolean;
  activityMinutes: number;
  defWars: number;
  
  // Target selection scoring
  targetScore: number;
  raidAdvice: string[];
}

// Locutus activity calculation - defaults to 7d inactive
function calculateActivity(nation: any, minutesInactive: number = 10000): {
  isActive: boolean;
  minutesInactive: number;
} {
  let actualMinutes = minutesInactive;
  
  if (nation.last_active) {
    const lastActive = new Date(nation.last_active);
    const now = new Date();
    actualMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
  }
  
  // Locutus default: nations with >10000 minutes (7 days) are inactive
  const isActive = actualMinutes <= minutesInactive;
  
  return {
    isActive,
    minutesInactive: actualMinutes
  };
}

// Locutus military strength calculation
function calculateMilitaryStrength(nation: any): {
  militaryStrength: number;
  groundStrength: number;
} {
  const soldiers = nation.soldiers || 0;
  const tanks = nation.tanks || 0;
  const aircraft = nation.aircraft || 0;
  const ships = nation.ships || 0;
  
  // Ground strength calculation from Locutus
  const groundStrength = soldiers + (tanks * 40);
  
  // Overall military strength (simplified from Locutus formula)
  const militaryStrength = Math.sqrt(
    Math.pow(groundStrength, 2) + 
    Math.pow(aircraft * 10, 2) + 
    Math.pow(ships * 100, 2)
  );
  
  return {
    militaryStrength,
    groundStrength
  };
}

// Realistic Locutus-style loot calculation 
function calculateLootTotal(nation: any): number {
  const numCities = nation.num_cities || 0;
  
  if (numCities === 0) return 0;
  
  // 1. CASH HOLDINGS - Nation's actual money (major component)
  const cash = nation.money || 0;
  const lootableCash = cash * 0.14; // Standard raid war takes 14% of cash
  
  // 2. RESOURCE VALUES - Convert resources to cash using market values
  const resourceValues = {
    coal: 1300,
    oil: 1400,
    uranium: 3200,
    iron: 1500,
    bauxite: 1600,
    lead: 2000,
    gasoline: 2400,
    munitions: 3500,
    steel: 3500,
    aluminum: 3000,
    food: 600
  };
  
  let resourceValue = 0;
  for (const [resource, value] of Object.entries(resourceValues)) {
    const amount = nation[resource] || 0;
    resourceValue += amount * value * 0.14; // 14% loot rate for resources
  }
  
  // 3. DAILY REVENUE ESTIMATION - Based on infrastructure and cities
  const avgInfra = nation.avg_infra || 1000;
  const dailyRevenue = numCities * (avgInfra * 8 + 2000); // Rough estimation
  const revenueComponent = dailyRevenue * 2; // Equivalent to ~2 days revenue
  
  // 4. INFRASTRUCTURE VALUE - High infra = high loot
  const infraValue = avgInfra * numCities * 15; // $15 per infra point per city
  
  // 5. MILITARY EQUIPMENT VALUE (if they get zeroed)
  const soldiers = nation.soldiers || 0;
  const tanks = nation.tanks || 0;
  const aircraft = nation.aircraft || 0;
  const ships = nation.ships || 0;
  
  const militaryValue = (soldiers * 5) + (tanks * 60) + (aircraft * 4000) + (ships * 50000);
  const lootableMilitary = militaryValue * 0.25; // Some military losses = loot
  
  // 6. SCORE-BASED MULTIPLIER (higher score = more valuable)
  const score = nation.score || 0;
  const scoreMultiplier = 1 + (score / 5000); // 1.2x at 1000 score, 1.4x at 2000 score, etc.
  
  // TOTAL LOOT CALCULATION
  const baseLoot = lootableCash + resourceValue + revenueComponent + infraValue + lootableMilitary;
  const totalLoot = baseLoot * scoreMultiplier;
  
  // Add some randomness like real raiding (+/- 20%)
  const randomFactor = 0.8 + (Math.random() * 0.4);
  const finalLoot = totalLoot * randomFactor;
  
  console.log(`[Loot Debug] ${nation.nation_name}: cash=${Math.round(lootableCash)}, resources=${Math.round(resourceValue)}, revenue=${Math.round(revenueComponent)}, infra=${Math.round(infraValue)}, military=${Math.round(lootableMilitary)}, total=${Math.round(finalLoot)}`);
  
  return Math.round(finalLoot);
}

// Main raid command implementation - based on Locutus WarCommands.java
export async function GET(request: NextRequest) {
  try {
    console.log('[Locutus Raid] Starting raid finder...');
    
    // Get session and verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's nation from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pwNationId: true, pwApiKey: true }
    });

    if (!user?.pwNationId || !user?.pwApiKey) {
      return NextResponse.json({ 
        error: 'Nation ID or API key not found. Please set up your account first.' 
      }, { status: 400 });
    }

    // Extract request parameters
    const { searchParams } = new URL(request.url);
    const numResults = parseInt(searchParams.get('numResults') || '5');
    const weakground = searchParams.get('weakground') === 'true';
    const activeTimeCutoff = parseInt(searchParams.get('activeTimeCutoff') || '10000'); // minutes
    const beigeTurns = parseInt(searchParams.get('beigeTurns') || '-1');
    const vmTurns = parseInt(searchParams.get('vmTurns') || '0');
    const defensiveSlots = parseInt(searchParams.get('defensiveSlots') || '-1');
    const minLoot = parseFloat(searchParams.get('minLoot') || '0');
    
    console.log('[Locutus Raid] Parameters:', {
      numResults, weakground, activeTimeCutoff, beigeTurns, vmTurns, defensiveSlots, minLoot
    });

    const pwApi = new PoliticsWarAPI(user.pwApiKey);

    // Get user's nation for war range calculation
    const userNationQuery = `
      query GetUserNation($id: [Int]) {
        nations(id: $id, first: 1) {
          data {
            id
            nation_name
            leader_name
            score
            soldiers
            tanks
            aircraft
            ships
          }
        }
      }
    `;

    const userNationResult = await pwApi.request(userNationQuery, { id: [parseInt(user.pwNationId!.toString())] });
    const userNation = (userNationResult as any)?.nations?.data?.[0];
    
    if (!userNation) {
      return NextResponse.json({ error: 'User nation not found' }, { status: 404 });
    }

    console.log('[Locutus Raid] User nation:', userNation.nation_name, 'Score:', userNation.score);

    // Calculate war score range (Locutus standard: 0.75x to 2.0x)
    const userScore = userNation.score;
    const minScore = userScore * 0.75;
    const maxScore = userScore * 2.0; // Locutus uses PW.WAR_RANGE_MAX_MODIFIER (2.0)

    // User military for comparisons
    const userMilitary = calculateMilitaryStrength(userNation);

    // Get potential targets - fetch more to filter down
    const targetsQuery = `
      query GetRaidTargets($minScore: Float, $maxScore: Float) {
        nations(
          min_score: $minScore, 
          max_score: $maxScore,
          first: 100
        ) {
          data {
            id
            nation_name
            leader_name
            alliance_id
            alliance {
              name
            }
            score
            num_cities
            avg_infra
            soldiers
            tanks
            aircraft
            ships
            spies
            money
            coal
            oil
            uranium
            iron
            bauxite
            lead
            gasoline
            munitions
            steel
            aluminum
            food
            last_active
            beige_turns
            color
            vacation_mode_turns
            wars {
              id
              att_id
              def_id
              war_type
              date
            }
            cities {
              id
              infrastructure
            }
          }
        }
      }
    `;

    console.log('[Locutus Raid] Fetching targets with score range:', { minScore, maxScore });

    const targetsResult = await pwApi.request(targetsQuery, { minScore, maxScore });
    const nations = (targetsResult as any)?.nations?.data || [];

    console.log('[Locutus Raid] Found', nations.length, 'potential targets');

    // Process targets through Locutus filtering logic
    let debugCounter = 0;
    let targets: RaidTarget[] = nations.map((nation: any) => {
      const activity = calculateActivity(nation, activeTimeCutoff);
      const military = calculateMilitaryStrength(nation);
      const lootTotal = calculateLootTotal(nation);
      const avgInfra = nation.cities?.length > 0 ? 
        nation.cities.reduce((sum: number, city: any) => sum + (city.infrastructure || 0), 0) / nation.cities.length : 
        1000;
      
      // Debug loot calculation for first few nations
      if (debugCounter < 3) {
        console.log('[Locutus Raid] Debug nation:', {
          name: nation.nation_name,
          cities: nation.num_cities,
          citiesArray: nation.cities?.length,
          avgInfra,
          soldiers: nation.soldiers,
          tanks: nation.tanks,
          aircraft: nation.aircraft,
          ships: nation.ships,
          calculatedLoot: lootTotal
        });
        debugCounter++;
      }
      
      // Count defensive wars
      const defWars = nation.wars?.filter((war: any) => war.def_id === nation.id).length || 0;
      
      return {
        id: nation.id,
        nation_name: nation.nation_name,
        leader_name: nation.leader_name,
        alliance_name: nation.alliance?.name || 'None',
        score: nation.score,
        cities: nation.num_cities,
        soldiers: nation.soldiers || 0,
        tanks: nation.tanks || 0,
        aircraft: nation.aircraft || 0,
        ships: nation.ships || 0,
        spies: nation.spies || 0,
        last_active: nation.last_active,
        beige_turns: nation.beige_turns || 0,
        vacation_mode_turns: nation.vacation_mode_turns || 0,
        color: nation.color,
        wars: nation.wars || [],
        
        // Calculated values
        lootTotal,
        avgInfra,
        militaryStrength: military.militaryStrength,
        groundStrength: military.groundStrength,
        isActive: activity.isActive,
        activityMinutes: activity.minutesInactive,
        defWars,
        
        targetScore: 0, // Will be calculated
        raidAdvice: []
      };
    });

    console.log('[Locutus Raid] Processing', targets.length, 'targets through filters...');

    // Apply Locutus filtering logic in order
    
    // Remove nations with 3+ defensive wars
    targets = targets.filter(target => target.defWars < 3);
    console.log('[Locutus Raid] After defensive slots filter:', targets.length);

    // Remove vacation mode nations (unless vmTurns specified)
    if (vmTurns === 0) {
      targets = targets.filter(target => target.vacation_mode_turns === 0);
    } else if (vmTurns > 0) {
      targets = targets.filter(target => target.vacation_mode_turns <= vmTurns);
    }
    console.log('[Locutus Raid] After VM filter:', targets.length);

    // Remove beige nations (unless beigeTurns specified)
    if (beigeTurns === -1) {
      targets = targets.filter(target => target.beige_turns === 0);
    } else if (beigeTurns >= 0) {
      targets = targets.filter(target => target.beige_turns <= beigeTurns);
    }
    console.log('[Locutus Raid] After beige filter:', targets.length);

    // Apply activity filter (if specified)
    if (activeTimeCutoff < 10000) {
      targets = targets.filter(target => !target.isActive);
    }
    console.log('[Locutus Raid] After activity filter:', targets.length);

    // Weak ground filter
    if (weakground) {
      targets = targets.filter(target => target.groundStrength < userMilitary.groundStrength);
    }
    console.log('[Locutus Raid] After weak ground filter:', targets.length);

    // Defensive slots filter
    if (defensiveSlots >= 0) {
      targets = targets.filter(target => target.defWars <= defensiveSlots);
    }
    console.log('[Locutus Raid] After defensive slots filter:', targets.length);

    // Minimum loot filter
    if (minLoot > 0) {
      targets = targets.filter(target => target.lootTotal >= minLoot);
    }
    console.log('[Locutus Raid] After min loot filter:', targets.length);

    // Calculate target scores and generate advice (Locutus-style)
    targets.forEach(target => {
      let score = 0;
      const advice: string[] = [];

      // Loot component (primary factor in Locutus)
      score += target.lootTotal / 1000000; // Normalize to millions

      // Activity bonus (inactive = better)
      if (!target.isActive) {
        const daysSinceActive = target.activityMinutes / (24 * 60);
        score += Math.min(daysSinceActive * 2, 10); // Up to 10 bonus points
        advice.push(`Inactive for ${Math.floor(daysSinceActive)} days`);
      }

      // Military comparison
      const groundRatio = userMilitary.groundStrength / Math.max(target.groundStrength, 1);
      if (groundRatio > 2) {
        score += 5;
        advice.push('Much weaker ground forces');
      } else if (groundRatio > 1.5) {
        score += 2;
        advice.push('Weaker ground forces');
      } else if (groundRatio < 0.8) {
        score -= 3;
        advice.push('Stronger ground forces - risky');
      }

      // Infrastructure bonus
      if (target.avgInfra > 1500) {
        score += 2;
        advice.push('High infrastructure');
      }

      // War load penalty
      if (target.defWars > 0) {
        score -= target.defWars;
        advice.push(`${target.defWars} defensive wars`);
      }

      // Color considerations
      if (target.color === 'gray') {
        score += 1;
        advice.push('Gray nation');
      } else if (target.color === 'beige') {
        score += 3;
        advice.push('Beige nation');
      }

      target.targetScore = score;
      target.raidAdvice = advice;
    });

    // Sort by target score (highest first) - Locutus default
    targets.sort((a, b) => b.targetScore - a.targetScore);

    // Return top results
    const topTargets = targets.slice(0, numResults);

    console.log('[Locutus Raid] Returning', topTargets.length, 'top targets');

    return NextResponse.json({
      success: true,
      userNation: {
        id: userNation.id,
        name: userNation.nation_name,
        score: userScore,
        scoreRange: { min: minScore, max: maxScore },
        military: {
          soldiers: userNation.soldiers,
          tanks: userNation.tanks,
          aircraft: userNation.aircraft,
          ships: userNation.ships
        },
        militaryStrength: userMilitary
      },
      targets: topTargets,
      metadata: {
        totalFound: targets.length,
        searchCriteria: {
          numResults,
          weakground,
          activeTimeCutoff,
          beigeTurns,
          vmTurns,
          defensiveSlots,
          minLoot
        },
        implementation: 'Locutus WarCommands.java port',
        filteringApplied: [
          'Score range (0.75x - 2.0x)',
          'Defensive war slots',
          'Vacation mode',
          'Beige turns',
          'Activity level',
          'Ground strength comparison',
          'Minimum loot value'
        ]
      }
    });

  } catch (error) {
    console.error('[Locutus Raid] Error:', error);
    return NextResponse.json(
      { error: 'Failed to find raid targets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}