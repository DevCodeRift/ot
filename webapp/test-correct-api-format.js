// Test the exact API key with the correct P&W API request format

async function testCorrectApiRequest() {
  try {
    console.log('🔍 Testing P&W API with Correct Request Format...\n');

    const apiKey = '05e5e3753de6b6f257f4'; // From the screenshot

    console.log(`🔑 Using API key: ${apiKey}`);

    // Test with the URL parameter format (as suggested in the P&W error message)
    console.log('\n📡 Testing with URL parameter format...');
    
    const urlParamQuery = `{
      me {
        nation {
          id
          nation_name
          leader_name
        }
      }
    }`;

    const urlParamResponse = await fetch(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: urlParamQuery })
    });

    const urlParamData = await urlParamResponse.json();
    
    if (urlParamData.errors) {
      console.log('❌ URL parameter format failed:', urlParamData.errors);
    } else {
      console.log('✅ URL parameter format works!', urlParamData.data);
    }

    // Test with header format
    console.log('\n📡 Testing with header format...');
    
    const headerResponse = await fetch('https://api.politicsandwar.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({ query: urlParamQuery })
    });

    const headerData = await headerResponse.json();
    
    if (headerData.errors) {
      console.log('❌ Header format failed:', headerData.errors);
    } else {
      console.log('✅ Header format works!', headerData.data);
    }

    // Test recent wars to see if we can access war data
    console.log('\n⚔️ Testing war data access...');
    
    const warQuery = `{
      wars(first: 5, orderBy: { column: DATE, order: DESC }) {
        data {
          id
          date
          att_id
          def_id
          attacker { nation_name alliance { name } }
          defender { nation_name alliance { name } }
        }
      }
    }`;

    const warResponse = await fetch(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: warQuery })
    });

    const warData = await warResponse.json();
    
    if (warData.errors) {
      console.log('❌ War data access failed:', warData.errors);
    } else if (warData.data?.wars?.data) {
      console.log('✅ War data access works!');
      console.log(`Found ${warData.data.wars.data.length} recent wars:`);
      
      for (const war of warData.data.wars.data) {
        console.log(`  • War ${war.id}: ${war.attacker.nation_name} vs ${war.defender.nation_name}`);
        console.log(`    Date: ${war.date}`);
      }
    }

    // Now let's check if the issue is with pnwkit-2.0 library
    console.log('\n🔧 Now checking if the issue is with our bot\'s pnwkit usage...');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCorrectApiRequest();