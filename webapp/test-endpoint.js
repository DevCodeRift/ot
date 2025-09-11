// Test our actual API endpoint
const apiKey = '05e5e3753de6b6f257f4';

async function testApiEndpoint() {
  try {
    console.log('Testing our API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/user/api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: apiKey
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('Could not parse as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testApiEndpoint();
