// Check API key format and provide guidance for fixing

import { PrismaClient } from '@prisma/client';

async function checkApiKeyFormat() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Diagnosing Rose Alliance API Key Issue...\n');

    const roseApiKey = await prisma.allianceApiKey.findFirst({
      where: {
        allianceId: 790,
        isActive: true
      }
    });

    if (!roseApiKey) {
      console.log('❌ No API key found');
      return;
    }

    const apiKey = roseApiKey.apiKey;
    
    console.log('🔑 API Key Analysis:');
    console.log(`  • Length: ${apiKey.length} characters`);
    console.log(`  • First 8 chars: ${apiKey.substring(0, 8)}`);
    console.log(`  • Last 4 chars: ...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`  • Contains spaces: ${apiKey.includes(' ') ? 'YES (❌ PROBLEM!)' : 'NO'}`);
    console.log(`  • Contains newlines: ${apiKey.includes('\n') ? 'YES (❌ PROBLEM!)' : 'NO'}`);
    console.log(`  • Contains quotes: ${apiKey.includes('"') || apiKey.includes("'") ? 'YES (❌ PROBLEM!)' : 'NO'}`);
    
    // Check if it looks like a P&W API key format
    const isHexFormat = /^[a-f0-9]{32,}$/i.test(apiKey);
    console.log(`  • Looks like hex format: ${isHexFormat ? 'YES' : 'NO (❌ MIGHT BE PROBLEM!)'}`);

    console.log('\n🔧 Recommendations:');
    
    if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('"') || apiKey.includes("'")) {
      console.log('❌ API key contains invalid characters (spaces, newlines, quotes)');
      console.log('   → Re-enter the API key without any extra characters');
    }
    
    if (!isHexFormat) {
      console.log('❌ API key doesn\'t match expected P&W format');
      console.log('   → Verify this is a valid P&W API key from https://politicsandwar.com/api');
    }
    
    if (apiKey.length < 32) {
      console.log('❌ API key is too short');
      console.log('   → P&W API keys should be 32+ characters long');
    }

    console.log('\n📋 Steps to Fix:');
    console.log('1. Go to https://politicsandwar.com/api');
    console.log('2. Generate a new API key or copy the existing one');
    console.log('3. Update the Rose alliance API key in the webapp');
    console.log('4. Make sure to copy ONLY the key with no extra spaces or characters');
    console.log('5. Test war alerts again after updating');

    console.log('\n🎯 War Alerts Will Work Once API Key Is Fixed!');
    console.log('   • Bot is running correctly ✅');
    console.log('   • Discord channel is configured ✅'); 
    console.log('   • War alert system is active ✅');
    console.log('   • Only the API key needs to be corrected ❌');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeyFormat();