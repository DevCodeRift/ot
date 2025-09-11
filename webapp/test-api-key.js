// Test script to validate Politics & War API key
const apiKey = '05e5e3753de6b6f257f4';
const POLITICS_WAR_GRAPHQL_URL = 'https://api.politicsandwar.com/graphql';

async function testApiKey() {
  try {
    console.log('Testing API key:', apiKey);
    
    // Build the URL with query parameters like our API client does
    const url = new URL(POLITICS_WAR_GRAPHQL_URL);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('query', '{me{nation{id nation_name leader_name alliance_id alliance{id name acronym}}}}');
    
    console.log('Request URL:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    if (!response.ok) {
      console.error('HTTP error! status:', response.status);
      return;
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
      }
      
      if (data.data && data.data.me && data.data.me.nation) {
        console.log('✅ API key is valid!');
        console.log('Nation data:', data.data.me.nation);
      } else {
        console.log('❌ API key validation failed - no nation data returned');
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApiKey();
