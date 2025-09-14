// Debug P&W API to find Rose wars
async function debugRoseWars() {
  console.log('🔍 Debugging Rose Wars Detection');
  console.log('================================');

  const apiKey = '05e5e3753de6b6f257f4';

  try {
    // First, let's get recent wars WITHOUT date filtering to see what's there
    console.log('\n1️⃣ Getting recent wars (no date filter)...');
    
    const basicQuery = `{
      wars(first: 50, orderBy: { column: DATE, order: DESC }) {
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
      body: JSON.stringify({ query: basicQuery })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.log('❌ P&W API Error:', data.errors);
      return;
    }

    const allWars = data.data?.wars?.data || [];
    console.log(`📊 Total recent wars found: ${allWars.length}`);

    if (allWars.length > 0) {
      console.log(`📅 Date range: ${new Date(allWars[allWars.length - 1].date).toLocaleDateString()} to ${new Date(allWars[0].date).toLocaleDateString()}`);
    }

    // Look for Rose wars in ANY recent wars
    const roseWars = allWars.filter(war => 
      war.att_alliance_id === '790' || war.def_alliance_id === '790'
    );

    console.log(`🌹 Rose wars found in recent data: ${roseWars.length}`);

    if (roseWars.length > 0) {
      console.log('\n📋 Rose Wars Found:');
      console.log('==================');
      
      roseWars.forEach((war, index) => {
        const isRoseAttacking = war.att_alliance_id === '790';
        const opponent = isRoseAttacking ? war.defender : war.attacker;
        
        console.log(`\n${index + 1}. War ID: ${war.id}`);
        console.log(`   Date: ${new Date(war.date).toLocaleString()}`);
        console.log(`   Rose Role: ${isRoseAttacking ? 'ATTACKING' : 'DEFENDING'}`);
        console.log(`   VS: ${opponent.nation_name}`);
        console.log(`   Opponent Alliance: ${opponent.alliance?.name || 'No Alliance'} (ID: ${isRoseAttacking ? war.def_alliance_id || 'None' : war.att_alliance_id || 'None'})`);
        console.log(`   Type: ${war.war_type} | Reason: ${war.reason}`);
      });
    } else {
      console.log('\n🔍 No Rose wars in recent 50 wars. Let\'s check all alliance IDs...');
      
      // Show all unique alliance IDs to debug
      const alliances = new Set();
      allWars.forEach(war => {
        if (war.att_alliance_id && war.att_alliance_id !== '0') alliances.add(war.att_alliance_id);
        if (war.def_alliance_id && war.def_alliance_id !== '0') alliances.add(war.def_alliance_id);
      });
      
      console.log(`🏛️ Alliance IDs in recent wars: ${Array.from(alliances).sort().join(', ')}`);
      console.log('💡 Is 790 in this list? If not, Rose hasn\'t had recent wars');
    }

    // Now let's try to get Rose alliance info to verify the ID
    console.log('\n2️⃣ Verifying Rose alliance ID...');
    
    const allianceQuery = `{
      alliances(id: [790]) {
        data {
          id
          name
          acronym
        }
      }
    }`;

    const allianceResponse = await fetch(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: allianceQuery })
    });

    const allianceData = await allianceResponse.json();
    
    if (allianceData.data?.alliances?.data?.[0]) {
      const rose = allianceData.data.alliances.data[0];
      console.log(`✅ Rose Alliance confirmed: ID ${rose.id}, Name: "${rose.name}", Acronym: "${rose.acronym}"`);
    } else {
      console.log('❌ Could not find alliance with ID 790');
    }

    // Final summary
    console.log('\n🎯 DIAGNOSIS:');
    console.log('=============');
    if (roseWars.length > 0) {
      console.log(`✅ Found ${roseWars.length} Rose wars in recent data`);
      console.log('🤖 Bot should detect these! The issue might be in our bot deployment');
    } else {
      console.log('❌ No Rose wars found in recent 50 wars');
      console.log('💡 Either Rose hasn\'t had wars recently, or there\'s an ID issue');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugRoseWars();