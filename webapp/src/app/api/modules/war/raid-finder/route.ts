import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PoliticsWarAPI } from '@/lib/politics-war-api';

// Simple in-memory cache for performance optimization
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T, ttlMinutes: number = 5): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000
  });
  
  // Simple cache cleanup - remove old entries
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [cacheKey, value] of cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        cache.delete(cacheKey);
      }
    }
  }
}

// Enhanced multi-factor activity detection inspired by Locutus
async function checkNationActivity(pwApi: PoliticsWarAPI, nationId: number, daysBack: number = 7): Promise<{
  isActive: boolean;
  activityScore: number;
  activityLevel: 'VERY_ACTIVE' | 'ACTIVE' | 'MODERATE' | 'INACTIVE' | 'VERY_INACTIVE';
  tradeCount: number;
  bankRecordCount: number;
  warCount: number;
  lastActiveMinutes: number;
  details: string;
  factors: {
    loginActivity: number;
    economicActivity: number;
    warActivity: number;
    overallActivity: number;
  };
}> {
  try {
    const formatDateForPW = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - daysBack);
    const formattedDate = formatDateForPW(daysAgo);

    // Get comprehensive nation data for activity analysis
    const nationQuery = `
      query GetNationActivity($id: [Int], $after: DateTime) {
        nations(id: $id, first: 1) {
          data {
            id
            last_active
            wars(first: 20) {
              data {
                id
                date
                attacker_id
                defender_id
                war_type
              }
            }
          }
        }
      }
    `;

    // Check trades
    const tradesQuery = `
      query GetRecentTrades($nationId: [Int], $after: DateTime) {
        trades(nation_id: $nationId, after: $after, first: 50) {
          data {
            id
            accepted
            date
          }
        }
      }
    `;

    // Check bank records
    const bankQuery = `
      query GetBankRecords($nationId: [Int], $after: DateTime) {
        bankrecs(or_id: $nationId, after: $after, first: 50) {
          data {
            id
            date
          }
        }
      }
    `;

    const [nationResult, tradesResult, bankResult] = await Promise.all([
      pwApi.request(nationQuery, { id: [nationId], after: formattedDate }).catch(() => ({ nations: { data: [] } })),
      pwApi.request(tradesQuery, { nationId: [nationId], after: formattedDate }).catch(() => ({ trades: { data: [] } })),
      pwApi.request(bankQuery, { nationId: [nationId], after: formattedDate }).catch(() => ({ bankrecs: { data: [] } }))
    ]);

    const nation = (nationResult as any)?.nations?.data?.[0];
    const trades = (tradesResult as any)?.trades?.data || [];
    const bankRecords = (bankResult as any)?.bankrecs?.data || [];
    const wars = nation?.wars?.data || [];
    
    // Calculate time since last active (in minutes)
    let lastActiveMinutes = 99999; // Default to very high number if no data
    if (nation?.last_active) {
      const lastActiveDate = new Date(nation.last_active);
      const now = new Date();
      lastActiveMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
    }

    // Count recent activities
    const tradeCount = trades.length;
    const bankRecordCount = bankRecords.length;
    const warCount = wars.length;

    // Activity factor calculations (inspired by Locutus methodology)
    
    // 1. Login Activity Factor (most important)
    let loginActivity = 0;
    if (lastActiveMinutes < 60) loginActivity = 100;        // Very recent (1 hour)
    else if (lastActiveMinutes < 360) loginActivity = 80;   // Recent (6 hours)
    else if (lastActiveMinutes < 1440) loginActivity = 60;  // Today
    else if (lastActiveMinutes < 4320) loginActivity = 40;  // 3 days
    else if (lastActiveMinutes < 10080) loginActivity = 20; // 1 week
    else loginActivity = 0;                                 // Very inactive

    // 2. Economic Activity Factor
    let economicActivity = 0;
    economicActivity += Math.min(tradeCount * 10, 50);      // Trades (max 50 points)
    economicActivity += Math.min(bankRecordCount * 15, 50); // Bank activity (max 50 points)

    // 3. War Activity Factor
    let warActivity = 0;
    const recentWars = wars.filter((war: any) => {
      const warDate = new Date(war.date);
      const daysAgo = (new Date().getTime() - warDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= daysBack;
    });
    warActivity = Math.min(recentWars.length * 20, 100); // Recent wars (max 100 points)

    // Overall activity score (weighted average inspired by Locutus)
    const overallActivity = (
      loginActivity * 0.5 +      // Login activity is most important (50%)
      economicActivity * 0.3 +   // Economic activity (30%)
      warActivity * 0.2          // War activity (20%)
    );

    // Determine activity level
    let activityLevel: 'VERY_ACTIVE' | 'ACTIVE' | 'MODERATE' | 'INACTIVE' | 'VERY_INACTIVE';
    if (overallActivity >= 80) activityLevel = 'VERY_ACTIVE';
    else if (overallActivity >= 60) activityLevel = 'ACTIVE';
    else if (overallActivity >= 30) activityLevel = 'MODERATE';
    else if (overallActivity >= 10) activityLevel = 'INACTIVE';
    else activityLevel = 'VERY_INACTIVE';

    // Consider nation active if overall activity score > 20 (more nuanced than binary)
    const isActive = overallActivity > 20;
    
    // Build detailed activity description
    let details = '';
    if (isActive) {
      details = `${activityLevel}: ${tradeCount} trades, ${bankRecordCount} bank records, ${warCount} wars`;
      if (lastActiveMinutes < 1440) {
        details += `, last active ${Math.floor(lastActiveMinutes / 60)}h ago`;
      } else {
        details += `, last active ${Math.floor(lastActiveMinutes / 1440)}d ago`;
      }
    } else {
      details = `${activityLevel}: Minimal activity (${Math.floor(lastActiveMinutes / 1440)}d since login)`;
    }

    return {
      isActive,
      activityScore: Math.round(overallActivity),
      activityLevel,
      tradeCount,
      bankRecordCount,
      warCount,
      lastActiveMinutes,
      details,
      factors: {
        loginActivity: Math.round(loginActivity),
        economicActivity: Math.round(economicActivity),
        warActivity: Math.round(warActivity),
        overallActivity: Math.round(overallActivity)
      }
    };
  } catch (error) {
    console.log(`[Activity Check] Error checking activity for nation ${nationId}:`, error);
    return {
      isActive: true, // Default to active if check fails to avoid false negatives
      activityScore: 50,
      activityLevel: 'MODERATE',
      tradeCount: 0,
      bankRecordCount: 0,
      warCount: 0,
      lastActiveMinutes: 99999,
      details: 'Activity check failed',
      factors: {
        loginActivity: 50,
        economicActivity: 0,
        warActivity: 0,
        overallActivity: 50
      }
    };
  }
}

// Military unit values and calculations inspired by Locutus
const MILITARY_UNIT_VALUES = {
  SOLDIER: { cost: 5, strength: 1 },
  TANK: { cost: 60, strength: 40 },
  AIRCRAFT: { cost: 4000, strength: 100 },
  SHIP: { cost: 50000, strength: 200 }
};

// Military strength calculation based on Locutus methodology
function calculateMilitaryStrength(soldiers: number, tanks: number, aircraft: number, ships: number): {
  groundStrength: number;
  airStrength: number;
  navalStrength: number;
  totalStrength: number;
  militaryValue: number;
} {
  // Ground strength calculation (soldiers + tanks with efficiency)
  const groundStrength = soldiers + (tanks * 40);
  
  // Air strength
  const airStrength = aircraft;
  
  // Naval strength
  const navalStrength = ships;
  
  // Total military strength (weighted combination)
  const totalStrength = Math.sqrt(
    Math.pow(groundStrength, 2) + 
    Math.pow(airStrength * 10, 2) + 
    Math.pow(navalStrength * 100, 2)
  );

  // Calculate total military value in money
  const militaryValue = 
    (soldiers * MILITARY_UNIT_VALUES.SOLDIER.cost) +
    (tanks * MILITARY_UNIT_VALUES.TANK.cost) +
    (aircraft * MILITARY_UNIT_VALUES.AIRCRAFT.cost) +
    (ships * MILITARY_UNIT_VALUES.SHIP.cost);

  return {
    groundStrength,
    airStrength,
    navalStrength,
    totalStrength,
    militaryValue
  };
}

// Raid success analysis inspired by Locutus combat calculations
function analyzeRaidViability(
  attackerMilitary: { soldiers: number; tanks: number; aircraft: number; ships: number; },
  defenderMilitary: { soldiers: number; tanks: number; aircraft: number; ships: number; },
  defenderActivity: { isActive: boolean; activityLevel: string; lastActiveMinutes: number; }
): {
  canGroundAttack: boolean;
  canAirAttack: boolean;
  canNavalAttack: boolean;
  groundControlChance: number;
  airSuperiorityChance: number;
  blockadeChance: number;
  overallSuccessChance: number;
  raidAdvice: string[];
} {
  const attStrength = calculateMilitaryStrength(
    attackerMilitary.soldiers, attackerMilitary.tanks, 
    attackerMilitary.aircraft, attackerMilitary.ships
  );
  
  const defStrength = calculateMilitaryStrength(
    defenderMilitary.soldiers, defenderMilitary.tanks, 
    defenderMilitary.aircraft, defenderMilitary.ships
  );

  // Ground control analysis
  const groundRatio = attStrength.groundStrength / Math.max(defStrength.groundStrength, 1);
  const canGroundAttack = attStrength.groundStrength > 0;
  let groundControlChance = Math.min(groundRatio * 0.7, 0.95); // Cap at 95%

  // Air superiority analysis  
  const airRatio = attStrength.airStrength / Math.max(defStrength.airStrength, 1);
  const canAirAttack = attStrength.airStrength > 0;
  let airSuperiorityChance = Math.min(airRatio * 0.6, 0.95);

  // Naval blockade analysis
  const navalRatio = attStrength.navalStrength / Math.max(defStrength.navalStrength, 1);
  const canNavalAttack = attStrength.navalStrength > 0;
  let blockadeChance = Math.min(navalRatio * 0.5, 0.95);

  // Activity modifier (inactive defenders are easier targets)
  const activityModifier = defenderActivity.isActive ? 1.0 : 1.3;
  if (!defenderActivity.isActive) {
    groundControlChance = Math.min(groundControlChance * activityModifier, 0.98);
    airSuperiorityChance = Math.min(airSuperiorityChance * activityModifier, 0.98);
    blockadeChance = Math.min(blockadeChance * activityModifier, 0.98);
  }

  // Overall success chance (weighted average)
  const overallSuccessChance = (
    groundControlChance * 0.4 +
    airSuperiorityChance * 0.3 +
    blockadeChance * 0.3
  );

  // Generate raid advice
  const raidAdvice: string[] = [];
  
  if (groundControlChance > 0.7) {
    raidAdvice.push("Strong ground advantage - excellent for looting");
  } else if (groundControlChance > 0.4) {
    raidAdvice.push("Moderate ground advantage - good raid potential");
  } else {
    raidAdvice.push("Ground disadvantage - risky for sustained looting");
  }

  if (airSuperiorityChance > 0.7) {
    raidAdvice.push("Air superiority likely - can protect ground forces");
  } else if (defStrength.airStrength > attStrength.airStrength * 1.5) {
    raidAdvice.push("Enemy air advantage - expect air attacks");
  }

  if (blockadeChance > 0.6) {
    raidAdvice.push("Naval superiority - can blockade enemy");
  }

  if (!defenderActivity.isActive) {
    raidAdvice.push("Inactive target - higher success chance");
  }

  if (overallSuccessChance > 0.7) {
    raidAdvice.push("Excellent raid target");
  } else if (overallSuccessChance > 0.4) {
    raidAdvice.push("Good raid target");
  } else {
    raidAdvice.push("Challenging target - consider alternatives");
  }

  return {
    canGroundAttack,
    canAirAttack,
    canNavalAttack,
    groundControlChance: Math.round(groundControlChance * 100) / 100,
    airSuperiorityChance: Math.round(airSuperiorityChance * 100) / 100,
    blockadeChance: Math.round(blockadeChance * 100) / 100,
    overallSuccessChance: Math.round(overallSuccessChance * 100) / 100,
    raidAdvice
  };
}

// Building production values per turn (approximate values)
const BUILDING_PRODUCTION: { [key: string]: { resource: string; amount: number } } = {
  coal_mine: { resource: 'COAL', amount: 3 },
  oil_well: { resource: 'OIL', amount: 3 },
  uranium_mine: { resource: 'URANIUM', amount: 3 },
  lead_mine: { resource: 'LEAD', amount: 3 },
  iron_mine: { resource: 'IRON', amount: 3 },
  bauxite_mine: { resource: 'BAUXITE', amount: 3 },
  farm: { resource: 'FOOD', amount: 12 },
  oil_refinery: { resource: 'GASOLINE', amount: 6 },
  aluminum_refinery: { resource: 'ALUMINUM', amount: 3 },
  steel_mill: { resource: 'STEEL', amount: 9 },
  munitions_factory: { resource: 'MUNITIONS', amount: 18 },
  factory: { resource: 'TANKS', amount: 0.25 }, // Special case for tanks
  hangar: { resource: 'AIRCRAFT', amount: 0.25 }, // Special case for aircraft
  drydock: { resource: 'SHIPS', amount: 0.08 }, // Special case for ships
};

interface CityBuildings {
  coal_mine: number;
  oil_well: number;
  uranium_mine: number;
  lead_mine: number;
  iron_mine: number;
  bauxite_mine: number;
  farm: number;
  oil_refinery: number;
  aluminum_refinery: number;
  steel_mill: number;
  munitions_factory: number;
  factory: number;
  hangar: number;
  drydock: number;
  bank: number;
  hospital: number;
  police_station: number;
  shopping_mall: number;
  stadium: number;
  subway: number;
  supermarket: number;
  recycling_center: number;
  barracks: number;
  infrastructure: number;
  powered: boolean;
}

interface TargetNation {
  id: string;
  name: string;
  leader: string;
  score: number;
  alliance_id?: number;
  alliance_name?: string;
  cities: number;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  totalResourceValue: number;
  productionValue: number;
  militaryValue: number;
  accessibleValue: number;
  originalResourceValue?: number; // Value before activity bonus
  dailyProduction: { [resource: string]: number };
  cityBuildings: CityBuildings[];
  last_active: string;
  beige_turns: number;
  color: string;
  vacation_mode_turns: number;
  activityStatus?: {
    isActive: boolean;
    activityScore: number;
    activityLevel: string;
    details: string;
    valueBonus: string;
    factors: {
      loginActivity: number;
      economicActivity: number;
      warActivity: number;
      overallActivity: number;
    };
  };
  militaryStrength: {
    groundStrength: number;
    airStrength: number;
    navalStrength: number;
    totalStrength: number;
    militaryValue: number;
  };
  raidAnalysis?: {
    canGroundAttack: boolean;
    canAirAttack: boolean;
    canNavalAttack: boolean;
    groundControlChance: number;
    airSuperiorityChance: number;
    blockadeChance: number;
    overallSuccessChance: number;
    raidAdvice: string[];
    lootAccessibility: number;
  };
  targetScore: number; // Overall target attractiveness score
}

async function calculateNationValue(
  nation: any, 
  marketPrices: { [resource: string]: number },
  attackerMilitary?: { soldiers: number; tanks: number; aircraft: number; ships: number; }
): Promise<{
  totalValue: number;
  productionValue: number;
  militaryValue: number;
  accessibleValue: number;
  dailyProduction: { [resource: string]: number };
  cityBuildings: CityBuildings[];
  militaryStrength: ReturnType<typeof calculateMilitaryStrength>;
  lootAccessibility: number;
}> {
  let productionValue = 0;
  const dailyProduction: { [resource: string]: number } = {};
  const cityBuildings: CityBuildings[] = [];

  // Calculate military strength and value
  const militaryStrength = calculateMilitaryStrength(
    nation.soldiers || 0, 
    nation.tanks || 0, 
    nation.aircraft || 0, 
    nation.ships || 0
  );

  // Calculate production value from cities
  for (const city of nation.cities || []) {
    const buildings: CityBuildings = {
      coal_mine: city.coal_mine || 0,
      oil_well: city.oil_well || 0,
      uranium_mine: city.uranium_mine || 0,
      lead_mine: city.lead_mine || 0,
      iron_mine: city.iron_mine || 0,
      bauxite_mine: city.bauxite_mine || 0,
      farm: city.farm || 0,
      oil_refinery: city.oil_refinery || 0,
      aluminum_refinery: city.aluminum_refinery || 0,
      steel_mill: city.steel_mill || 0,
      munitions_factory: city.munitions_factory || 0,
      factory: city.factory || 0,
      hangar: city.hangar || 0,
      drydock: city.drydock || 0,
      bank: city.bank || 0,
      hospital: city.hospital || 0,
      police_station: city.police_station || 0,
      shopping_mall: city.shopping_mall || 0,
      stadium: city.stadium || 0,
      subway: city.subway || 0,
      supermarket: city.supermarket || 0,
      recycling_center: city.recycling_center || 0,
      barracks: city.barracks || 0,
      infrastructure: city.infrastructure || 0,
      powered: city.powered || false,
    };

    cityBuildings.push(buildings);

    // Calculate production value for this city
    Object.entries(BUILDING_PRODUCTION).forEach(([buildingType, production]) => {
      const buildingCount = buildings[buildingType as keyof CityBuildings] as number;
      if (buildingCount > 0) {
        const resourceProduction = buildingCount * production.amount;
        
        // Apply power bonus if city is powered (except for raw materials)
        const powerMultiplier = city.powered && ['GASOLINE', 'ALUMINUM', 'STEEL', 'MUNITIONS'].includes(production.resource) ? 1.5 : 1;
        const actualProduction = resourceProduction * powerMultiplier;
        
        if (!dailyProduction[production.resource]) {
          dailyProduction[production.resource] = 0;
        }
        dailyProduction[production.resource] += actualProduction;
        
        // Calculate monetary value
        const resourcePrice = marketPrices[production.resource] || 0;
        productionValue += actualProduction * resourcePrice;
      }
    });

    // Add infrastructure value (can be destroyed in raids)
    const infraValue = city.infrastructure * 50; // Rough estimate of infra rebuild cost
    productionValue += infraValue;
  }

  // Calculate loot accessibility based on military comparison
  let lootAccessibility = 1.0; // Default to fully accessible
  
  if (attackerMilitary) {
    const defenderMilitary = {
      soldiers: nation.soldiers || 0,
      tanks: nation.tanks || 0,
      aircraft: nation.aircraft || 0,
      ships: nation.ships || 0
    };

    const attackerStrength = calculateMilitaryStrength(
      attackerMilitary.soldiers, attackerMilitary.tanks,
      attackerMilitary.aircraft, attackerMilitary.ships
    );

    // Accessibility based on ground control potential
    const groundRatio = attackerStrength.groundStrength / Math.max(militaryStrength.groundStrength, 1);
    
    if (groundRatio >= 2.0) {
      lootAccessibility = 0.9; // Easy access
    } else if (groundRatio >= 1.5) {
      lootAccessibility = 0.75; // Good access
    } else if (groundRatio >= 1.0) {
      lootAccessibility = 0.6; // Moderate access
    } else if (groundRatio >= 0.75) {
      lootAccessibility = 0.4; // Difficult access
    } else {
      lootAccessibility = 0.2; // Very difficult access
    }

    // Blockade penalty if defender has naval superiority
    if (militaryStrength.navalStrength > attackerStrength.navalStrength * 1.5) {
      lootAccessibility *= 0.8; // Reduce accessibility due to potential blockade
    }
  }

  const accessibleValue = (productionValue + militaryStrength.militaryValue) * lootAccessibility;
  const totalValue = productionValue + militaryStrength.militaryValue;

  return { 
    totalValue,
    productionValue,
    militaryValue: militaryStrength.militaryValue,
    accessibleValue,
    dailyProduction, 
    cityBuildings,
    militaryStrength,
    lootAccessibility
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Raid Finder] API called');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[Raid Finder] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Raid Finder] Session found for user:', session.user.id);
    const searchParams = request.nextUrl.searchParams;
    const allianceId = searchParams.get('allianceId');
    const minActivity = parseInt(searchParams.get('minActivity') || '7'); // Days
    const excludeAlliances = searchParams.get('excludeAlliances')?.split(',').filter(Boolean) || [];
    const excludeColors = searchParams.get('excludeColors')?.split(',').filter(Boolean) || [];
    const excludeVacation = searchParams.get('excludeVacation') === 'true';
    const excludeBeige = searchParams.get('excludeBeige') === 'true';
    
    // Advanced filtering options inspired by Locutus
    const weakGroundOnly = searchParams.get('weakGroundOnly') === 'true';
    const maxDefensiveSlots = parseInt(searchParams.get('maxDefensiveSlots') || '3');
    const minGroundRatio = parseFloat(searchParams.get('minGroundRatio') || '0.0'); // Attacker ground strength ratio
    const maxAirRatio = parseFloat(searchParams.get('maxAirRatio') || '10.0'); // Max defender air ratio
    const maxNavalRatio = parseFloat(searchParams.get('maxNavalRatio') || '10.0'); // Max defender naval ratio
    const minSuccessChance = parseFloat(searchParams.get('minSuccessChance') || '0.0'); // Min overall success chance
    const includeStrongTargets = searchParams.get('includeStrongTargets') === 'true'; // Include militarily superior targets
    const minLootValue = parseFloat(searchParams.get('minLootValue') || '0'); // Minimum loot value threshold
    const sortBy = searchParams.get('sortBy') || 'targetScore'; // targetScore, accessibleValue, successChance

    console.log('[Raid Finder] Filters:', { 
      allianceId, minActivity, excludeAlliances, excludeColors, excludeVacation, excludeBeige,
      weakGroundOnly, maxDefensiveSlots, minGroundRatio, maxAirRatio, maxNavalRatio, 
      minSuccessChance, includeStrongTargets, minLootValue, sortBy
    });

    if (!allianceId) {
      console.log('[Raid Finder] No alliance ID provided');
      return NextResponse.json({ error: 'Alliance ID is required' }, { status: 400 });
    }

    // Get user's API key and nation ID from session/database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pwApiKey: true, pwNationId: true }
    });

    console.log('[Raid Finder] User data:', { hasApiKey: !!user?.pwApiKey, nationId: user?.pwNationId });

    if (!user?.pwNationId) {
      console.log('[Raid Finder] User nation ID not found');
      return NextResponse.json({ error: 'User nation ID not found in profile' }, { status: 404 });
    }

    const userNationId = user.pwNationId.toString();

    let apiKey = user?.pwApiKey;
    
    if (!apiKey) {
      console.log('[Raid Finder] No API key found for user');
      return NextResponse.json({
        error: 'API key required. Please set your personal API key in your profile.',
        requiresApiKey: true
      }, { status: 400 });
    }

    // Initialize P&W API client
    const pwApi = new PoliticsWarAPI(apiKey!);

    console.log('[Raid Finder] Fetching user nation data for ID:', userNationId);

    // Get user's nation to determine war score range and military for comparison
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

    const userNationResult = await pwApi.request(userNationQuery, { id: [parseInt(userNationId)] }) as any;
    console.log('[Raid Finder] User nation result:', userNationResult);
    const userNation = userNationResult?.nations?.data?.[0];
    
    if (!userNation) {
      console.log('[Raid Finder] User nation not found in API response');
      return NextResponse.json({ error: 'User nation not found' }, { status: 404 });
    }

    console.log('[Raid Finder] User nation found:', userNation.nation_name, 'Score:', userNation.score);

    const userScore = userNation.score;
    const minScore = userScore * 0.75; // 75% of user's score
    const maxScore = userScore * 2.0; // 200% of user's score

    // User's military for comparison
    const userMilitary = {
      soldiers: userNation.soldiers || 0,
      tanks: userNation.tanks || 0,
      aircraft: userNation.aircraft || 0,
      ships: userNation.ships || 0
    };

    console.log('[Raid Finder] Score range:', { userScore, minScore, maxScore });
    console.log('[Raid Finder] User military:', userMilitary);

    // Get current market prices using top_trade_info query with caching
    const cacheKey = 'market_prices';
    let marketPrices = getCachedData<{ [resource: string]: number }>(cacheKey);
    
    if (!marketPrices) {
      console.log('[Raid Finder] Fetching fresh market prices...');
      const marketQuery = `
        query GetMarketPrices {
          top_trade_info {
            resources {
              resource
              average_price
            }
          }
        }
      `;

      const marketResult = await pwApi.request(marketQuery) as any;
      marketPrices = {};
      
      if (marketResult?.top_trade_info?.resources) {
        marketResult.top_trade_info.resources.forEach((resource: any) => {
          if (resource.resource && resource.average_price) {
            marketPrices![resource.resource] = resource.average_price;
          }
        });
      }

      // Set default prices if API data unavailable
      const defaultPrices = {
        COAL: 500, OIL: 1500, URANIUM: 1800, LEAD: 400, IRON: 600, BAUXITE: 600,
        FOOD: 100, GASOLINE: 2000, ALUMINUM: 1200, STEEL: 3000, MUNITIONS: 2500
      };
      Object.entries(defaultPrices).forEach(([resource, price]) => {
        if (!marketPrices![resource]) marketPrices![resource] = price;
      });
      
      // Cache market prices for 15 minutes
      setCachedData(cacheKey, marketPrices, 15);
    } else {
      console.log('[Raid Finder] Using cached market prices');
    }

    // Calculate activity date filter
    const activityDate = new Date();
    activityDate.setDate(activityDate.getDate() - minActivity);
    
    // Format date as YYYY-MM-DD HH:MM:SS for P&W API
    const formatDateForPW = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    
    const formattedActivityDate = formatDateForPW(activityDate);

    console.log('[Raid Finder] Fetching potential targets with filters:', {
      minScore, maxScore, activeSince: formattedActivityDate
    });

    // Get potential targets with their cities using GraphQL query
    const targetsQuery = `
      query GetPotentialTargets($minScore: Float, $maxScore: Float, $activeSince: DateTime) {
        nations(
          min_score: $minScore, 
          max_score: $maxScore, 
          active_since: $activeSince,
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
            last_active
            beige_turns
            color
            vacation_mode_turns
            cities {
              id
              infrastructure
              powered
              coal_mine
              oil_well
              uranium_mine
              lead_mine
              iron_mine
              bauxite_mine
              farm
              oil_refinery
              aluminum_refinery
              steel_mill
              munitions_factory
              factory
              hangar
              drydock
              bank
              hospital
              police_station
              shopping_mall
              stadium
              subway
              supermarket
              recycling_center
              barracks
            }
          }
        }
      }
    `;

    const targetsResult = await pwApi.request(targetsQuery, {
      minScore,
      maxScore,
      activeSince: formattedActivityDate
    }) as any;

    console.log('[Raid Finder] Targets query result:', {
      hasData: !!targetsResult?.nations?.data,
      count: targetsResult?.nations?.data?.length || 0,
      error: targetsResult?.error || targetsResult?.errors
    });

    if (!targetsResult?.nations?.data) {
      console.log('[Raid Finder] No targets data returned from API');
      return NextResponse.json({ error: 'Failed to fetch potential targets' }, { status: 500 });
    }

    // Calculate value for each target with enhanced analysis and filtering
    const targetPromises = targetsResult.nations.data.map(async (nation: any) => {
      // Basic filters
      if (excludeVacation && nation.vacation_mode_turns > 0) return null;
      if (excludeBeige && nation.beige_turns > 0) return null;
      if (excludeAlliances.includes(nation.alliance_id?.toString())) return null;
      if (excludeColors.includes(nation.color)) return null;
      if (nation.id === userNationId) return null; // Exclude the user's own nation
      
      // Defensive slots filter (inspired by Locutus)
      const currentDefensiveSlots = nation.defensive_wars?.length || 0;
      if (currentDefensiveSlots >= maxDefensiveSlots) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: too many defensive wars (${currentDefensiveSlots})`);
        return null;
      }

      // Enhanced activity analysis
      const activityCheck = await checkNationActivity(pwApi, nation.id, 7);
      
      // Enhanced value calculation with military analysis
      const { 
        totalValue, 
        productionValue, 
        militaryValue, 
        accessibleValue, 
        dailyProduction, 
        cityBuildings, 
        militaryStrength,
        lootAccessibility 
      } = await calculateNationValue(nation, marketPrices, userMilitary);

      // Military strength filtering (inspired by Locutus)
      const userMilitaryStrength = calculateMilitaryStrength(
        userMilitary.soldiers, userMilitary.tanks, userMilitary.aircraft, userMilitary.ships
      );

      // Ground strength ratio check
      const groundRatio = userMilitaryStrength.groundStrength / Math.max(militaryStrength.groundStrength, 1);
      if (groundRatio < minGroundRatio) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: insufficient ground ratio (${groundRatio.toFixed(2)})`);
        return null;
      }

      // Weak ground only filter
      if (weakGroundOnly && militaryStrength.groundStrength >= userMilitaryStrength.groundStrength) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: not weak ground target`);
        return null;
      }

      // Air superiority filter
      const airRatio = militaryStrength.airStrength / Math.max(userMilitaryStrength.airStrength, 1);
      if (airRatio > maxAirRatio) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: too strong air force (${airRatio.toFixed(2)})`);
        return null;
      }

      // Naval superiority filter
      const navalRatio = militaryStrength.navalStrength / Math.max(userMilitaryStrength.navalStrength, 1);
      if (navalRatio > maxNavalRatio) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: too strong navy (${navalRatio.toFixed(2)})`);
        return null;
      }

      // Raid viability analysis
      const defenderMilitary = {
        soldiers: nation.soldiers || 0,
        tanks: nation.tanks || 0,
        aircraft: nation.aircraft || 0,
        ships: nation.ships || 0
      };

      const raidAnalysis = analyzeRaidViability(
        userMilitary, 
        defenderMilitary, 
        {
          isActive: activityCheck.isActive,
          activityLevel: activityCheck.activityLevel,
          lastActiveMinutes: activityCheck.lastActiveMinutes
        }
      );

      // Success chance filter
      if (raidAnalysis.overallSuccessChance < minSuccessChance) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: low success chance (${raidAnalysis.overallSuccessChance})`);
        return null;
      }

      // Strong targets filter (unless explicitly included)
      if (!includeStrongTargets && militaryStrength.totalStrength > userMilitaryStrength.totalStrength * 1.2) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: too strong militarily`);
        return null;
      }

      // Calculate comprehensive target score (inspired by Locutus ranking)
      let targetScore = 0;
      
      // Base value component (40% weight)
      targetScore += (accessibleValue / 1000000) * 40; // Normalize to reasonable scale
      
      // Activity component (25% weight) - inactive nations are more valuable
      const activityBonus = activityCheck.isActive ? 0 : 25;
      targetScore += activityBonus;
      
      // Military advantage component (20% weight)
      targetScore += raidAnalysis.overallSuccessChance * 20;
      
      // Loot accessibility component (15% weight)
      targetScore += lootAccessibility * 15;

      // Apply activity-based value adjustment
      let finalTotalValue = totalValue;
      let finalAccessibleValue = accessibleValue;
      
      if (!activityCheck.isActive) {
        // Inactive nations accumulate resources - bonus based on activity level
        let inactivityMultiplier = 1.0;
        switch (activityCheck.activityLevel) {
          case 'VERY_INACTIVE':
            inactivityMultiplier = 1.4; // 40% bonus
            break;
          case 'INACTIVE':
            inactivityMultiplier = 1.25; // 25% bonus
            break;
          default:
            inactivityMultiplier = 1.1; // 10% bonus for moderate activity
        }
        
        finalTotalValue = totalValue * inactivityMultiplier;
        finalAccessibleValue = accessibleValue * inactivityMultiplier;
        
        console.log(`[Raid Finder] ${activityCheck.activityLevel} nation ${nation.nation_name} gets ${Math.round((inactivityMultiplier - 1) * 100)}% value boost`);
      }

      // Minimum loot value filter
      if (finalAccessibleValue < minLootValue) {
        console.log(`[Raid Finder] Skipping ${nation.nation_name}: insufficient loot value (${Math.round(finalAccessibleValue)})`);
        return null;
      }

      const target: TargetNation = {
        id: nation.id,
        name: nation.nation_name,
        leader: nation.leader_name,
        score: nation.score,
        alliance_id: nation.alliance_id,
        alliance_name: nation.alliance?.name,
        cities: nation.num_cities,
        soldiers: nation.soldiers,
        tanks: nation.tanks,
        aircraft: nation.aircraft,
        ships: nation.ships,
        totalResourceValue: finalTotalValue,
        productionValue,
        militaryValue,
        accessibleValue: finalAccessibleValue,
        originalResourceValue: totalValue,
        dailyProduction,
        cityBuildings,
        last_active: nation.last_active,
        beige_turns: nation.beige_turns,
        color: nation.color,
        vacation_mode_turns: nation.vacation_mode_turns,
        activityStatus: {
          isActive: activityCheck.isActive,
          activityScore: activityCheck.activityScore,
          activityLevel: activityCheck.activityLevel,
          details: activityCheck.details,
          valueBonus: !activityCheck.isActive ? 
            `${Math.round(((finalTotalValue / totalValue) - 1) * 100)}%` : 'None',
          factors: activityCheck.factors
        },
        militaryStrength,
        raidAnalysis: {
          ...raidAnalysis,
          lootAccessibility
        },
        targetScore: Math.round(targetScore * 100) / 100
      };

      return target;
    });

    const targets = (await Promise.all(targetPromises))
      .filter((target: any): target is TargetNation => target !== null)
      .sort((a: TargetNation, b: TargetNation) => {
        // Flexible sorting based on user preference
        switch (sortBy) {
          case 'accessibleValue':
            return b.accessibleValue - a.accessibleValue;
          case 'successChance':
            return (b.raidAnalysis?.overallSuccessChance || 0) - (a.raidAnalysis?.overallSuccessChance || 0);
          case 'totalValue':
            return b.totalResourceValue - a.totalResourceValue;
          case 'activity':
            return a.activityStatus!.activityScore - b.activityStatus!.activityScore; // Less active first
          case 'targetScore':
          default:
            // Primary sort by target score (comprehensive ranking)
            if (Math.abs(b.targetScore - a.targetScore) > 1) {
              return b.targetScore - a.targetScore;
            }
            // Secondary sort by accessible value for close scores
            return b.accessibleValue - a.accessibleValue;
        }
      });

    console.log(`[Raid Finder] Found ${targets.length} targets after filtering, top 5 by ${sortBy}:`, 
      targets.slice(0, 5).map(t => ({ 
        name: t.name, 
        targetScore: t.targetScore, 
        accessible: Math.round(t.accessibleValue),
        successChance: t.raidAnalysis?.overallSuccessChance || 0
      }))
    );

    return NextResponse.json({
      userNation: {
        id: userNation.id,
        name: userNation.nation_name,
        score: userScore,
        scoreRange: { min: minScore, max: maxScore },
        military: userMilitary,
        militaryStrength: calculateMilitaryStrength(
          userMilitary.soldiers, userMilitary.tanks, userMilitary.aircraft, userMilitary.ships
        )
      },
      targets: targets.slice(0, 50), // Return top 50 targets
      marketPrices,
      metadata: {
        totalFound: targets.length,
        searchCriteria: {
          minScore,
          maxScore,
          minActivity,
          excludeAlliances,
          excludeColors,
          excludeVacation,
          excludeBeige,
          weakGroundOnly,
          maxDefensiveSlots,
          minGroundRatio,
          maxAirRatio,
          maxNavalRatio,
          minSuccessChance,
          includeStrongTargets,
          minLootValue,
          sortBy
        },
        analysisInfo: {
          enhancedActivityDetection: true,
          militaryAnalysis: true,
          lootAccessibilityCalculation: true,
          sophisticatedTargetScoring: true,
          advancedFiltering: true,
          locutusInspiredFeatures: [
            'Multi-factor activity detection',
            'Military strength analysis', 
            'Loot accessibility calculation',
            'Comprehensive target scoring',
            'Advanced filtering options',
            'Raid viability analysis'
          ]
        }
      }
    });

  } catch (error) {
    console.error('[Raid Finder] Error occurred:', error);
    if (error instanceof Error) {
      console.error('[Raid Finder] Error message:', error.message);
      console.error('[Raid Finder] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to find raid targets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}