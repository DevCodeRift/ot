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
  
  // Debug breakdown for frontend display
  debugBreakdown?: {
    baseIncomePerCity: number;
    totalGrossIncome: number;
    netIncomePerDay: number;
    daysOfSavings: number;
    estimatedCash: number;
    lootableCash: number;
    resourceValue: number;
    infraLootValue: number;
    militaryValue: number;
    wealthMultiplier: number;
    inactivityBonus: number;
    finalLoot: number;
  };
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

// Realistic Locutus-style loot calculation based on estimated production
function calculateLootTotal(nation: any): { lootTotal: number; debugBreakdown: any } {
  const numCities = nation.num_cities || 0;
  
  if (numCities === 0) return { lootTotal: 0, debugBreakdown: null };
  
  // Calculate average infrastructure from cities data
  let avgInfra = 1000; // Default fallback
  if (nation.cities && nation.cities.length > 0) {
    const totalInfra = nation.cities.reduce((sum: number, city: any) => sum + (city.infrastructure || 0), 0);
    avgInfra = totalInfra / nation.cities.length;
  }
  
  // 1. ESTIMATED GROSS INCOME & CASH HOLDINGS
  // P&W Gross Income formula: roughly $1,200 + (Infrastructure * $15) per city
  // Plus commerce improvements, government bonuses, policies, etc.
  const baseIncomePerCity = 1200 + (avgInfra * 15); // Base income per city
  const commerceBonus = avgInfra * 5; // Estimate commerce improvements (higher infra = more commerce)
  const policyBonus = baseIncomePerCity * 0.1; // Assume ~10% policy bonus on average
  const grossIncomePerCity = baseIncomePerCity + commerceBonus + policyBonus;
  
  const totalGrossIncome = grossIncomePerCity * numCities;
  const netIncomeAfterUpkeep = totalGrossIncome * 0.75; // Account for military/city upkeep
  
  // Estimate accumulated cash (assume nations save 7-14 days of net income)
  const daysOfSavings = 7 + (avgInfra / 200); // Higher infra nations save more (7-12 days)
  const estimatedCash = netIncomeAfterUpkeep * daysOfSavings;
  const lootableCash = estimatedCash * 0.14; // 14% loot rate in raid wars
  
  // 2. ESTIMATED RESOURCE PRODUCTION - Based on infrastructure and cities
  // Higher infra = more resource production per city
  const resourceProductionFactor = avgInfra / 100; // Scale production with infra
  
  const estimatedDailyResources = {
    coal: numCities * (8 + resourceProductionFactor * 2),
    oil: numCities * (6 + resourceProductionFactor * 1.5),
    uranium: numCities * (2 + resourceProductionFactor * 0.5),
    iron: numCities * (8 + resourceProductionFactor * 2),
    bauxite: numCities * (6 + resourceProductionFactor * 1.5),
    lead: numCities * (4 + resourceProductionFactor * 1),
    gasoline: numCities * (4 + resourceProductionFactor * 1),
    munitions: numCities * (3 + resourceProductionFactor * 0.8),
    steel: numCities * (3 + resourceProductionFactor * 0.8),
    aluminum: numCities * (3 + resourceProductionFactor * 0.8),
    food: numCities * (12 + resourceProductionFactor * 3)
  };
  
  // Assume nations stockpile resources for 14 days on average
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
  
  let estimatedResourceValue = 0;
  for (const [resource, dailyProduction] of Object.entries(estimatedDailyResources)) {
    const stockpile = dailyProduction * 14; // 14 days of stockpiling
    const marketValue = resourceValues[resource as keyof typeof resourceValues];
    estimatedResourceValue += stockpile * marketValue * 0.14; // 14% loot rate
  }
  
  // 3. INFRASTRUCTURE LOOT VALUE
  // When you win wars, you can loot infrastructure improvements
  const infraLootValue = avgInfra * numCities * 25; // $25 per infra point (infrastructure improvements)
  
  // 4. MILITARY EQUIPMENT VALUE (when units are destroyed)
  const soldiers = nation.soldiers || 0;
  const tanks = nation.tanks || 0;
  const aircraft = nation.aircraft || 0;
  const ships = nation.ships || 0;
  
  const militaryValue = (soldiers * 5) + (tanks * 60) + (aircraft * 4000) + (ships * 50000);
  const lootableMilitary = militaryValue * 0.30; // 30% of military value as loot
  
  // 5. SCORE-BASED WEALTH MULTIPLIER & NATION FACTORS
  // Higher score nations are generally wealthier and more established
  const score = nation.score || 0;
  let wealthMultiplier = 1 + Math.log10(Math.max(score / 100, 1)); // Logarithmic wealth scaling
  
  // Color bonuses affect wealth accumulation
  const color = nation.color?.toLowerCase();
  if (color === 'gray' || color === 'beige') {
    wealthMultiplier *= 0.8; // New/recovering nations have less wealth
  } else if (color === 'green' || color === 'blue') {
    wealthMultiplier *= 1.1; // Peaceful colors accumulate more wealth
  }
  
  // Alliance membership typically means better resource access
  if (nation.alliance_id && nation.alliance_id > 0) {
    wealthMultiplier *= 1.15; // Alliance nations typically 15% wealthier
  }
  
  // Nations in wars have reduced income and depleted resources
  const numWars = nation.wars?.length || 0;
  if (numWars > 0) {
    wealthMultiplier *= Math.max(0.6, 1 - (numWars * 0.2)); // War penalty, minimum 60%
  }
  
  // 6. BEIGE/INACTIVE BONUS
  // Inactive nations accumulate more resources
  const activity = calculateActivity(nation, 10000);
  const inactivityBonus = activity.isActive ? 1.0 : 1.5; // 50% bonus for inactive nations
  
  // TOTAL LOOT CALCULATION
  const baseLoot = lootableCash + estimatedResourceValue + infraLootValue + lootableMilitary;
  const adjustedLoot = baseLoot * wealthMultiplier * inactivityBonus;
  
  // Add some variance (+/- 15%)
  const randomFactor = 0.85 + (Math.random() * 0.30);
  const finalLoot = adjustedLoot * randomFactor;
  
  console.log(`[Loot Debug] ${nation.nation_name}: cities=${numCities}, avgInfra=${Math.round(avgInfra)}, estimatedCash=${Math.round(lootableCash)}, resources=${Math.round(estimatedResourceValue)}, infra=${Math.round(infraLootValue)}, military=${Math.round(lootableMilitary)}, multiplier=${Math.round(wealthMultiplier * 100)/100}, total=${Math.round(finalLoot)}`);
  
  // Detailed calculation breakdown for debugging
  console.log(`[Loot Breakdown] ${nation.nation_name}:`);
  console.log(`  → Base Income/City: $${Math.round(baseIncomePerCity).toLocaleString()}`);
  console.log(`  → Total Gross Income: $${Math.round(totalGrossIncome).toLocaleString()}/day`);
  console.log(`  → Net Income (after upkeep): $${Math.round(netIncomeAfterUpkeep).toLocaleString()}/day`);
  console.log(`  → Days of Savings: ${Math.round(daysOfSavings * 10)/10}`);
  console.log(`  → Estimated Cash: $${Math.round(estimatedCash).toLocaleString()}`);
  console.log(`  → Lootable Cash (14%): $${Math.round(lootableCash).toLocaleString()}`);
  console.log(`  → Resource Stockpile Value: $${Math.round(estimatedResourceValue).toLocaleString()}`);
  console.log(`  → Infrastructure Loot: $${Math.round(infraLootValue).toLocaleString()}`);
  console.log(`  → Military Equipment: $${Math.round(lootableMilitary).toLocaleString()}`);
  console.log(`  → Wealth Multiplier: ${Math.round(wealthMultiplier * 100)/100}x (score: ${nation.score})`);
  console.log(`  → Inactivity Bonus: ${Math.round(inactivityBonus * 100)/100}x`);
  console.log(`  → Final Loot Total: $${Math.round(finalLoot).toLocaleString()}`);
  
  return {
    lootTotal: Math.round(finalLoot),
    debugBreakdown: {
      baseIncomePerCity: Math.round(baseIncomePerCity),
      totalGrossIncome: Math.round(totalGrossIncome),
      netIncomePerDay: Math.round(netIncomeAfterUpkeep),
      daysOfSavings: Math.round(daysOfSavings * 10) / 10,
      estimatedCash: Math.round(estimatedCash),
      lootableCash: Math.round(lootableCash),
      resourceValue: Math.round(estimatedResourceValue),
      infraLootValue: Math.round(infraLootValue),
      militaryValue: Math.round(lootableMilitary),
      wealthMultiplier: Math.round(wealthMultiplier * 100) / 100,
      inactivityBonus: Math.round(inactivityBonus * 100) / 100,
      finalLoot: Math.round(finalLoot)
    }
  };
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
            soldiers
            tanks
            aircraft
            ships
            spies
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
      const lootResult = calculateLootTotal(nation);
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
          calculatedLoot: lootResult.lootTotal
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
        lootTotal: lootResult.lootTotal,
        avgInfra,
        militaryStrength: military.militaryStrength,
        groundStrength: military.groundStrength,
        isActive: activity.isActive,
        activityMinutes: activity.minutesInactive,
        defWars,
        
        targetScore: 0, // Will be calculated
        raidAdvice: [],
        
        // Debug breakdown for frontend
        debugBreakdown: lootResult.debugBreakdown
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