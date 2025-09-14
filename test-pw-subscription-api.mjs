// Test P&W subscription API directly
async function testPWSubscriptionAPI() {
  console.log('🧪 Testing P&W Subscription API');
  console.log('===============================');

  const apiKey = '05e5e3753de6b6f257f4';

  try {
    console.log('\n1️⃣ Testing subscription endpoint...');
    
    const subscribeUrl = `https://api.politicsandwar.com/subscriptions/v1/subscribe/war/create?api_key=${apiKey}`;
    
    const response = await fetch(subscribeUrl, {
      method: 'GET'
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Subscription API works!');
      console.log('📡 Channel data:', data);
      
      if (data.channel) {
        console.log(`🔗 Channel name: ${data.channel}`);
        console.log('\n✅ SUCCESS: The subscription API is working!');
        console.log('🤖 The bot will use this channel to receive real-time war events');
        console.log('⚡ Wars involving Rose (alliance 790) will trigger instant Discord alerts');
      } else {
        console.log('❌ No channel in response');
      }
    } else {
      console.log('❌ Subscription API failed');
      const text = await response.text();
      console.log('Error response:', text);
    }

    console.log('\n2️⃣ Bot behavior:');
    console.log('================');
    console.log('🔄 Bot connects to Pusher with channel from step 1');
    console.log('👂 Bot listens for WAR_CREATE events');
    console.log('🎯 Bot filters for alliance 790 (Rose) wars');
    console.log('📢 Bot sends Discord alerts immediately when Rose wars happen');
    console.log('\n💡 The next Rose war will trigger an instant alert!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPWSubscriptionAPI();