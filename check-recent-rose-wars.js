// Check for recent Rose alliance wars
async function checkRecentRoseWars() {
  console.log('🔍 Checking Recent Rose Alliance Wars');
  console.log('====================================');

  const apiKey = '05e5e3753de6b6f257f4';

  try {
    // Get wars from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();

    console.log(`📅 Searching for wars since: ${weekAgo.toLocaleDateString()}`);

    const query = `{
      wars(first: 100, orderBy: { column: DATE, order: DESC }, date_after: "${weekAgoISO}") {
        data {
          id
          date
          reason
          war_type
          att_id
          def_id
          att_alliance_id
          def_alliance_id
          attacker { 
            nation_name 
            alliance { name acronym }
          }
          defender { 
            nation_name 
            alliance { name acronym }
          }
        }
      }
    }`;

    const response = await fetch(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    const allWars = data.data?.wars?.data || [];
    
    console.log(`📊 Total wars in last 7 days: ${allWars.length}`);

    // Filter for Rose (alliance ID 790)
    const roseWars = allWars.filter(war => 
      war.att_alliance_id === '790' || war.def_alliance_id === '790'
    );

    console.log(`🌹 Rose alliance wars: ${roseWars.length}`);

    if (roseWars.length > 0) {
      console.log('\n📋 Rose Wars in Last 7 Days:');
      console.log('============================');
      
      roseWars.forEach((war, index) => {
        const isRoseAttacking = war.att_alliance_id === '790';
        const opponent = isRoseAttacking ? war.defender : war.attacker;
        
        console.log(`\n${index + 1}. War ID: ${war.id}`);
        console.log(`   Date: ${new Date(war.date).toLocaleString()}`);
        console.log(`   Rose Role: ${isRoseAttacking ? 'ATTACKING' : 'DEFENDING'}`);
        console.log(`   VS: ${opponent.nation_name} (${opponent.alliance?.name || 'No Alliance'})`);
        console.log(`   Type: ${war.war_type} | Reason: ${war.reason}`);
      });

      console.log(`\n✅ FOUND ${roseWars.length} RECENT ROSE WARS!`);
      console.log('🤖 Updated bot will process these on startup');
      console.log('📢 Discord alerts should appear when bot deploys');
    } else {
      console.log('\n💡 No Rose alliance wars in last 7 days');
      console.log('🎯 Bot is ready to detect NEW wars as they happen');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRecentRoseWars();