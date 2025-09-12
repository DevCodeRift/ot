import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PoliticsWarAPI } from '@/lib/politics-war-api';

// Activity detection function
async function checkNationActivity(pwApi: PoliticsWarAPI, nationId: number, daysBack: number = 7): Promise<{
  isActive: boolean;
  activityScore: number;
  tradeCount: number;
  bankRecordCount: number;
  details: string;
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

    // Check trades
    const tradesQuery = `
      query GetRecentTrades($nationId: [Int], $after: DateTime) {
        trades(nation_id: $nationId, after: $after, first: 50) {
          data {
            id
            accepted
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
          }
        }
      }
    `;

    const [tradesResult, bankResult] = await Promise.all([
      pwApi.request(tradesQuery, { nationId: [nationId], after: formattedDate }).catch(() => ({ trades: { data: [] } })),
      pwApi.request(bankQuery, { nationId: [nationId], after: formattedDate }).catch(() => ({ bankrecs: { data: [] } }))
    ]);

    const trades = (tradesResult as any)?.trades?.data || [];
    const bankRecords = (bankResult as any)?.bankrecs?.data || [];
    
    const tradeCount = trades.length;
    const bankRecordCount = bankRecords.length;
    const activityScore = tradeCount + (bankRecordCount * 2); // Bank activity weighted higher

    // Consider nation inactive if no economic activity in the timeframe
    const isActive = activityScore > 0;
    
    let details = '';
    if (isActive) {
      details = `${tradeCount} trades, ${bankRecordCount} bank records`;
    } else {
      details = 'No recent economic activity';
    }

    return {
      isActive,
      activityScore,
      tradeCount,
      bankRecordCount,
      details
    };
  } catch (error) {
    console.log(`[Activity Check] Error checking activity for nation ${nationId}:`, error);
    return {
      isActive: true, // Default to active if check fails to avoid false negatives
      activityScore: 0,
      tradeCount: 0,
      bankRecordCount: 0,
      details: 'Activity check failed'
    };
  }
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
    details: string;
    valueBonus: string;
  };
}

async function calculateNationValue(nation: any, marketPrices: { [resource: string]: number }): Promise<{
  totalValue: number;
  dailyProduction: { [resource: string]: number };
  cityBuildings: CityBuildings[];
}> {
  let totalValue = 0;
  const dailyProduction: { [resource: string]: number } = {};
  const cityBuildings: CityBuildings[] = [];

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
        totalValue += actualProduction * resourcePrice;
      }
    });

    // Add infrastructure value (can be destroyed in raids)
    const infraValue = city.infrastructure * 50; // Rough estimate of infra rebuild cost
    totalValue += infraValue;
  }

  return { totalValue, dailyProduction, cityBuildings };
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

    console.log('[Raid Finder] Filters:', { allianceId, minActivity, excludeAlliances, excludeColors, excludeVacation, excludeBeige });

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

    // Get user's nation to determine war score range using GraphQL query
    const userNationQuery = `
      query GetUserNation($id: [Int]) {
        nations(id: $id, first: 1) {
          data {
            id
            nation_name
            leader_name
            score
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

    console.log('[Raid Finder] Score range:', { userScore, minScore, maxScore });

    // Get current market prices using top_trade_info query
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
    const marketPrices: { [resource: string]: number } = {};
    
    if (marketResult?.top_trade_info?.resources) {
      marketResult.top_trade_info.resources.forEach((resource: any) => {
        if (resource.resource && resource.average_price) {
          marketPrices[resource.resource] = resource.average_price;
        }
      });
    }

    // Set default prices if API data unavailable
    const defaultPrices = {
      COAL: 500, OIL: 1500, URANIUM: 1800, LEAD: 400, IRON: 600, BAUXITE: 600,
      FOOD: 100, GASOLINE: 2000, ALUMINUM: 1200, STEEL: 3000, MUNITIONS: 2500
    };
    Object.entries(defaultPrices).forEach(([resource, price]) => {
      if (!marketPrices[resource]) marketPrices[resource] = price;
    });

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

    // Calculate value for each target
    const targetPromises = targetsResult.nations.data.map(async (nation: any) => {
      // Skip if nation doesn't meet filters
      if (excludeVacation && nation.vacation_mode_turns > 0) return null;
      if (excludeBeige && nation.beige_turns > 0) return null;
      if (excludeAlliances.includes(nation.alliance_id?.toString())) return null;
      if (excludeColors.includes(nation.color)) return null;
      if (nation.id === userNationId) return null; // Exclude the user's own nation

      // Check economic activity (for inactive nation detection)
      const activityCheck = await checkNationActivity(pwApi, nation.id, 7);
      
      const { totalValue, dailyProduction, cityBuildings } = await calculateNationValue(nation, marketPrices);

      // Boost value for inactive nations (they accumulate resources)
      let adjustedValue = totalValue;
      if (!activityCheck.isActive) {
        // Inactive nations are more valuable as they accumulate resources without spending
        adjustedValue = totalValue * 1.25; // 25% bonus for inactive nations
        console.log(`[Raid Finder] Inactive nation ${nation.nation_name} gets value boost: ${totalValue} -> ${adjustedValue}`);
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
        totalResourceValue: adjustedValue,
        originalResourceValue: totalValue, // Keep track of original value
        dailyProduction,
        cityBuildings,
        last_active: nation.last_active,
        beige_turns: nation.beige_turns,
        color: nation.color,
        vacation_mode_turns: nation.vacation_mode_turns,
        activityStatus: {
          isActive: activityCheck.isActive,
          activityScore: activityCheck.activityScore,
          details: activityCheck.details,
          valueBonus: !activityCheck.isActive ? '25%' : 'None'
        }
      };

      return target;
    });

    const targets = (await Promise.all(targetPromises))
      .filter((target: any): target is TargetNation => target !== null)
      .sort((a: TargetNation, b: TargetNation) => b.totalResourceValue - a.totalResourceValue);

    return NextResponse.json({
      userNation: {
        id: userNation.id,
        name: userNation.nation_name,
        score: userScore,
        scoreRange: { min: minScore, max: maxScore }
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
          excludeBeige
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