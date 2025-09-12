#!/usr/bin/env node

// Comprehensive Quest System Test
// This script tests all quest functionality end-to-end

const API_BASE = 'http://localhost:3000/api';
const ALLIANCE_ID = 790;

console.log('🚀 Starting Comprehensive Quest System Test');
console.log('='.repeat(50));

// Test configuration
const tests = [
  {
    name: 'Quest Module Access',
    url: `${API_BASE}/modules/quests/access?allianceId=${ALLIANCE_ID}`,
    method: 'GET',
    expected: 200
  },
  {
    name: 'List Quest Groups',
    url: `${API_BASE}/modules/quests/groups?allianceId=${ALLIANCE_ID}`,
    method: 'GET',
    expected: 200
  },
  {
    name: 'List Quests',
    url: `${API_BASE}/modules/quests?allianceId=${ALLIANCE_ID}`,
    method: 'GET',
    expected: 200
  },
  {
    name: 'Quest Progress',
    url: `${API_BASE}/modules/quests/progress?allianceId=${ALLIANCE_ID}`,
    method: 'GET',
    expected: 200
  }
];

// Function to test an API endpoint
async function testEndpoint(test) {
  try {
    console.log(`\n📡 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    const response = await fetch(test.url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.text();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === test.expected) {
      console.log('   ✅ PASS');
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.error) {
          console.log(`   ⚠️  Error: ${jsonData.error}`);
        } else {
          console.log(`   📊 Response keys: ${Object.keys(jsonData).join(', ')}`);
        }
      } catch (e) {
        console.log(`   📝 Response length: ${data.length} chars`);
      }
    } else {
      console.log('   ❌ FAIL');
      console.log(`   Expected: ${test.expected}, Got: ${response.status}`);
      console.log(`   Response: ${data.substring(0, 200)}...`);
    }
    
    return response.status === test.expected;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testEndpoint(test);
    if (result) passed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Quest system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
  
  // Additional manual testing suggestions
  console.log('\n🔧 Manual Testing Suggestions:');
  console.log('1. Visit http://localhost:3000/790/modules/quests');
  console.log('2. Try creating a new quest group');
  console.log('3. Create a quest with project requirements (e.g., Iron Works)');
  console.log('4. Create a quest with policy requirements (e.g., Blitzkrieg war policy)');
  console.log('5. Test quest assignment and progress tracking');
}

// Check if we're running in a browser environment
if (typeof window !== 'undefined') {
  console.log('Running in browser environment - tests will be limited');
} else {
  // Node.js environment - check if fetch is available
  if (typeof fetch === 'undefined') {
    console.log('⚠️  Fetch not available. Installing node-fetch...');
    try {
      const fetch = require('node-fetch');
      global.fetch = fetch;
    } catch (e) {
      console.log('❌ node-fetch not available. Please run: npm install node-fetch');
      process.exit(1);
    }
  }
}

runTests().catch(console.error);