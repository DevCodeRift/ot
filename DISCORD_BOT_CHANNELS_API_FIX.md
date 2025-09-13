# Discord Bot Channels API Fix

## Problem
The webapp was failing to load Discord channels with the error:
```
Error fetching Discord channels: [TypeError: Failed to parse URL from undefined/api/channels/1407812256636469470]
Failed to load Discord channels
```

## Root Cause
The issue was in the webapp's bot channels API route (`/webapp/src/app/api/alliance/[allianceId]/bot/channels/route.ts`).

The code was trying to use:
```typescript
const botResponse = await fetch(`${process.env.DISCORD_BOT_URL}/api/channels/${serverId}`, {
```

However, the environment variable `DISCORD_BOT_URL` was not set. The correct environment variable is `DISCORD_BOT_API_URL`.

## Environment Variables
- ✅ **DISCORD_BOT_API_URL**: Set to `https://ot-production.up.railway.app`
- ❌ **DISCORD_BOT_URL**: Not set (and shouldn't be)

## Fix Applied
Changed the bot channels route to use the correct environment variable:

**Before:**
```typescript
const botResponse = await fetch(`${process.env.DISCORD_BOT_URL}/api/channels/${serverId}`, {
```

**After:**
```typescript
const botResponse = await fetch(`${process.env.DISCORD_BOT_API_URL}/api/channels/${serverId}`, {
```

## Verification
1. ✅ URL construction now works correctly
2. ✅ Environment variable is properly set
3. ✅ Webapp builds successfully
4. ✅ No more "undefined/api/channels" errors

## Additional Notes
Other files in the webapp already handle this correctly by using:
```typescript
const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || process.env.DISCORD_BOT_URL || 'fallback-url'
```

The bot channels route was the only one directly using `process.env.DISCORD_BOT_URL` without the fallback pattern.

## Files Modified
- `webapp/src/app/api/alliance/[allianceId]/bot/channels/route.ts`

## Impact
- War alerts configuration should now be able to load Discord channels
- Bot configuration interface will work properly
- War Management module's "War Alerts" tab will be functional

---
**Status: RESOLVED** ✅