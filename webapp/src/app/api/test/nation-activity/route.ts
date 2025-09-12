import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PoliticsWarAPI } from '@/lib/politics-war-api';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nationId } = await request.json();
    
    if (!nationId) {
      return NextResponse.json({ error: 'Nation ID is required' }, { status: 400 });
    }

    // Get user's API key
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pwApiKey: true }
    });

    if (!user?.pwApiKey) {
      return NextResponse.json({
        error: 'API key required. Please set your personal API key in your profile.',
        requiresApiKey: true
      }, { status: 400 });
    }

    const pwApi = new PoliticsWarAPI(user.pwApiKey);

    // Format date for P&W API (7 days ago)
    const formatDateForPW = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const formattedDate = formatDateForPW(sevenDaysAgo);

    // Also try with a shorter timeframe for testing
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysFormatted = formatDateForPW(threeDaysAgo);

    console.log('[Activity Test] Testing nation:', nationId);
    console.log('[Activity Test] Current time:', new Date().toISOString());
    console.log('[Activity Test] 7 days ago filter:', formattedDate);
    console.log('[Activity Test] 3 days ago filter:', threeDaysFormatted);

    // 1. Get basic nation info
    const nationQuery = `
      query GetNation($id: [Int]) {
        nations(id: $id, first: 1) {
          data {
            id
            nation_name
            leader_name
            score
            num_cities
            last_active
            date
            alliance_id
            alliance {
              name
            }
          }
        }
      }
    `;

    const nationResult = await pwApi.request(nationQuery, { id: [nationId] }) as any;
    const nation = nationResult?.nations?.data?.[0];

    if (!nation) {
      return NextResponse.json({ error: 'Nation not found' }, { status: 404 });
    }

    console.log('[Activity Test] Nation found:', nation.nation_name);

    // 2. Check recent trades with better query
    const tradesQuery = `
      query GetRecentTrades($nationId: [Int], $after: DateTime) {
        trades(nation_id: $nationId, after: $after, first: 20) {
          data {
            id
            date
            type
            offer_resource
            buy_or_sell
            accepted
            offer_amount
            price
          }
        }
      }
    `;

    console.log('[Activity Test] Querying initial trades with date:', formattedDate);
    const tradesResult = await pwApi.request(tradesQuery, { 
      nationId: [nationId], 
      after: formattedDate 
    }) as any;
    const trades = tradesResult?.trades?.data || [];

    console.log('[Activity Test] Initial trades found:', trades.length);

    // 3. Check bank records (both sent and received)
    const bankQuery = `
      query GetBankRecords($nationId: [Int], $after: DateTime) {
        bankrecs(or_id: $nationId, after: $after, first: 50) {
          data {
            id
            date
            sender_id
            sender_type
            receiver_id
            receiver_type
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
            note
          }
        }
      }
    `;

    console.log('[Activity Test] Querying bank records with date:', formattedDate);
    const bankResult = await pwApi.request(bankQuery, { 
      nationId: [nationId], 
      after: formattedDate 
    }) as any;
    const bankRecords = bankResult?.bankrecs?.data || [];

    console.log('[Activity Test] Bank records found:', bankRecords.length);
    console.log('[Activity Test] Bank records sample:', bankRecords.slice(0, 2));

    // 4. Also check trades more broadly (both accepted and pending)
    const allTradesQuery = `
      query GetAllTrades($nationId: [Int], $after: DateTime) {
        trades(nation_id: $nationId, after: $after, first: 50) {
          data {
            id
            date
            type
            offer_resource
            buy_or_sell
            accepted
            offer_amount
            price
            sender_id
            receiver_id
          }
        }
      }
    `;

    console.log('[Activity Test] Querying all trades with date:', formattedDate);
    const allTradesResult = await pwApi.request(allTradesQuery, { 
      nationId: [nationId], 
      after: formattedDate 
    }) as any;
    const allTrades = allTradesResult?.trades?.data || [];

    console.log('[Activity Test] All trades found:', allTrades.length);
    console.log('[Activity Test] Trade sample:', allTrades.slice(0, 2));

    console.log('[Activity Test] Bank records found:', bankRecords.length);

    // Calculate activity score with improved logic
    const acceptedTrades = allTrades.filter((t: any) => t.accepted);
    const pendingTrades = allTrades.filter((t: any) => !t.accepted);
    const allianceDeposits = bankRecords.filter((b: any) => 
      b.sender_type === 1 && b.receiver_type === 2 && b.sender_id == nationId
    );
    const anyBankActivity = bankRecords.filter((b: any) => 
      b.sender_id == nationId || b.receiver_id == nationId
    );

    const activitySummary = {
      hasRecentTrades: allTrades.length > 0,
      hasBankActivity: bankRecords.length > 0,
      tradeCount: allTrades.length,
      acceptedTradeCount: acceptedTrades.length,
      pendingTradeCount: pendingTrades.length,
      bankRecordCount: bankRecords.length,
      allianceDepositCount: allianceDeposits.length,
      anyBankActivityCount: anyBankActivity.length,
      activityScore: allTrades.length + bankRecords.length * 2, // Bank activity weighted higher
      detailedScore: {
        acceptedTrades: acceptedTrades.length,
        pendingTrades: pendingTrades.length * 0.5, // Pending trades worth less
        bankActivity: bankRecords.length * 2,
        total: acceptedTrades.length + (pendingTrades.length * 0.5) + (bankRecords.length * 2)
      }
    };

    console.log('[Activity Test] Activity summary:', activitySummary);

    return NextResponse.json({
      nationId,
      nation,
      trades: allTrades,
      bankRecords,
      activitySummary,
      testDate: formattedDate,
      debugging: {
        originalTradesFound: trades.length,
        allTradesFound: allTrades.length,
        bankRecordsFound: bankRecords.length
      }
    });

  } catch (error) {
    console.error('[Activity Test] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test nation activity', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}