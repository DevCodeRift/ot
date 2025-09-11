// Test script that mimics our API route logic
const apiKey = '05e5e3753de6b6f257f4';

// Mock validation result based on actual API response
const validation = {
  valid: true,
  nation: {
    id: "701263",
    nation_name: "Profit", 
    leader_name: "Azra",
    alliance_id: "790",
    alliance: {
      id: "790",
      name: "Rose",
      acronym: "🌹"
    }
  }
};

console.log('=== Testing data conversion ===');
console.log('Original validation.nation.id:', validation.nation.id, typeof validation.nation.id);
console.log('Original validation.nation.alliance_id:', validation.nation.alliance_id, typeof validation.nation.alliance_id);

// Test the exact conversion our code does
const nationId = parseInt(validation.nation.id.toString());
const allianceId = validation.nation.alliance_id ? parseInt(validation.nation.alliance_id.toString()) : null;

console.log('Converted nationId:', nationId, typeof nationId);
console.log('Converted allianceId:', allianceId, typeof allianceId);

// Test the data objects we would create
const nationData = {
  id: nationId,
  nationName: validation.nation.nation_name,
  leaderName: validation.nation.leader_name,
  allianceId: allianceId,
  discordId: null, // would be from session
};

const allianceData = {
  id: allianceId,
  name: validation.nation.alliance.name,
  acronym: validation.nation.alliance.acronym,
};

const userData = {
  pwApiKey: apiKey,
  pwNationId: nationId,
  pwNationName: validation.nation.nation_name,
  currentAllianceId: allianceId,
};

console.log('=== Data objects that would be sent to database ===');
console.log('Nation data:', JSON.stringify(nationData, null, 2));
console.log('Alliance data:', JSON.stringify(allianceData, null, 2));
console.log('User data:', JSON.stringify(userData, null, 2));

// Check for any potential issues
console.log('=== Validation checks ===');
console.log('nationId is valid integer:', Number.isInteger(nationId) && nationId > 0);
console.log('allianceId is valid integer:', Number.isInteger(allianceId) && allianceId > 0);
console.log('nationId is safe integer:', Number.isSafeInteger(nationId));
console.log('allianceId is safe integer:', Number.isSafeInteger(allianceId));
