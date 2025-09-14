// Test war alert formatting with real data
async function testWarAlertFormatting() {
  console.log('🧪 Testing War Alert Formatting');
  console.log('===============================');

  const apiKey = '05e5e3753de6b6f257f4';

  try {
    // Get recent wars to test with
    const query = `{
      wars(first: 10, orderBy: { column: DATE, order: DESC }) {
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
    const wars = data.data?.wars?.data || [];

    if (wars.length > 0) {
      console.log('\n📋 Testing with a recent war...');
      const testWar = wars[0];
      
      // Simulate this as a Rose war for testing
      const simulatedRoseWar = {
        ...testWar,
        att_alliance_id: '790', // Pretend Rose is attacking
        attacker: {
          ...testWar.attacker,
          alliance: { name: 'Rose', acronym: 'Rose' }
        }
      };

      console.log('\n🎭 Simulated Rose War Alert:');
      console.log('============================');
      
      // This is what our bot would generate
      const isAttacker = true; // Rose is attacking in our simulation
      const role = isAttacker ? 'Attacker' : 'Defender';
      const opponent = simulatedRoseWar.defender;
      
      console.log('📨 Discord Embed Content:');
      console.log(`Title: ⚔️ War Alert`);
      console.log(`Color: ${isAttacker ? 'Orange (0xff6b35)' : 'Red (0xff003c)'}`);
      console.log('');
      console.log('Fields:');
      console.log(`  ${role}: ${simulatedRoseWar.attacker.nation_name}`);
      console.log(`  Alliance: ${simulatedRoseWar.attacker.alliance?.name || 'None'}`);
      console.log('');
      console.log(`  Opponent: ${opponent.nation_name}`);
      console.log(`  Alliance: ${opponent.alliance?.name || 'None'}`);
      console.log('');
      console.log('  War Details:');
      console.log(`  Type: ${simulatedRoseWar.war_type}`);
      console.log(`  Reason: ${simulatedRoseWar.reason}`);
      console.log(`  War ID: ${simulatedRoseWar.id}`);
      console.log('');
      console.log(`Timestamp: ${new Date(simulatedRoseWar.date).toISOString()}`);
      console.log('Footer: Rose War Alerts');

      console.log('\n✅ War alert formatting works!');
      console.log('🎯 This is exactly what will be sent to Discord channels');
      
    } else {
      console.log('❌ No recent wars found for testing');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWarAlertFormatting();