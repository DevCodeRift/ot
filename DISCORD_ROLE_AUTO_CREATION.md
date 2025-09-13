# Discord Role Auto-Creation Implementation

## Overview
This implementation enables automatic Discord role creation when alliance roles are created on the website. When an alliance administrator creates a new role on the website, the system now automatically:

1. Creates the role in the database
2. Calls the Discord bot to create corresponding Discord roles
3. Links the Discord role ID back to the database record
4. Returns the complete role information to the frontend

## Architecture

### Webapp Side
- **Endpoint**: `/api/bot/create-discord-role` (internal use)
- **Modified**: `/api/alliance/roles` POST method
- **Flow**: Role creation → Discord bot call → Database update with Discord role ID

### Discord Bot Side
- **Endpoint**: `/api/create-role` (Express route)
- **Implementation**: `discord-bot/src/routes/roles.ts`
- **Flow**: Receives role data → Creates Discord role in guild(s) → Returns Discord role ID

## Implementation Details

### 1. Enhanced Role Creation (webapp)
File: `webapp/src/app/api/alliance/roles/route.ts`

After creating an alliance role in the database, the system:
```typescript
// Create corresponding Discord role via bot
const discordCreateResult = await fetch(`${process.env.NEXTAUTH_URL}/api/bot/create-discord-role`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
  },
  body: JSON.stringify({
    allianceId: allianceId,
    roleId: newRole.id,
    roleName: newRole.name,
    roleDescription: newRole.description,
    roleColor: newRole.color
  })
})

if (discordCreateResult.ok) {
  const discordResult = await discordCreateResult.json()
  const discordRoleId = discordResult.discordRoleId
  
  // Update the alliance role with the Discord role ID
  await prisma.allianceRole.update({
    where: { id: newRole.id },
    data: { discordRoleId: discordRoleId }
  })
}
```

### 2. Internal Bot Communication Endpoint (webapp)
File: `webapp/src/app/api/bot/create-discord-role/route.ts`

This endpoint acts as a proxy between the webapp and Discord bot:
- Validates requests using `WEBAPP_BOT_SECRET`
- Forwards role creation requests to Discord bot
- Returns Discord role ID for database storage

### 3. Discord Role Creation Service (bot)
File: `discord-bot/src/routes/roles.ts`

The Discord bot endpoint:
- Validates incoming requests from webapp
- Fetches all Discord servers for the alliance
- Creates Discord roles in each server
- Returns the Discord role ID for linking

Key features:
- **Multi-server support**: Creates roles in all Discord servers for an alliance
- **Permission checking**: Verifies bot has ManageRoles permission
- **Error handling**: Graceful failure if role creation fails in some servers
- **Color conversion**: Converts hex colors to Discord color format

### 4. Database Schema Enhancement
The `alliance_roles` table includes:
```sql
discordRoleId String? -- Stores the Discord role ID for syncing
```

## Environment Variables

### Webapp (.env.local)
```bash
# Discord Bot Communication
DISCORD_BOT_URL="http://localhost:3001"
WEBAPP_BOT_SECRET="your-secure-secret-for-bot-communication"
```

### Discord Bot (.env)
```bash
# Webapp Integration
WEBAPP_API_URL="http://localhost:3000"
WEBAPP_BOT_SECRET="your-secure-secret-for-bot-communication"
```

## Security Features

### 1. Secure Communication
- All webapp-bot communication uses shared secret authentication
- Bearer token validation on all endpoints
- No sensitive data exposure in API responses

### 2. Error Handling
- Discord role creation failure doesn't prevent alliance role creation
- Detailed logging for debugging
- Graceful degradation if Discord bot is unavailable

### 3. Permission Validation
- Bot checks for ManageRoles permission before attempting creation
- Alliance permission checks on webapp side
- Multi-tenant isolation (roles only created in relevant Discord servers)

## API Flow Diagram

```
Website Role Creation Request
           ↓
    [Alliance Roles API]
           ↓
    Create role in database
           ↓
    Call /api/bot/create-discord-role
           ↓
    [Internal Bot Communication API]
           ↓
    Forward to Discord Bot /api/create-role
           ↓
    [Discord Bot Routes]
           ↓
    Get alliance Discord servers
           ↓
    Create Discord role in each server
           ↓
    Return Discord role ID
           ↓
    Update database with discordRoleId
           ↓
    Return complete role data to frontend
```

## Testing

### Manual Testing Steps
1. Create an alliance role on the website
2. Verify Discord role is created in linked Discord servers
3. Check that `discordRoleId` is stored in database
4. Verify role appears in role list with Discord ID

### Error Scenarios Tested
- Discord bot unavailable: Alliance role still created, no Discord role
- Bot lacks permissions: Role creation logged as failed, alliance role still created
- Invalid data: Proper validation and error responses

## Future Enhancements

### 1. Role Deletion Sync
- Delete Discord roles when alliance roles are deleted
- Handle orphaned Discord roles

### 2. Role Update Sync
- Update Discord role properties when alliance role is modified
- Sync role name, color, and permission changes

### 3. Bulk Operations
- Support for creating multiple roles at once
- Batch Discord role operations for efficiency

### 4. Role Hierarchy
- Support Discord role positioning/hierarchy
- Automatic role ordering based on alliance structure

## Troubleshooting

### Common Issues

1. **Discord role not created**
   - Check bot permissions in Discord server
   - Verify `WEBAPP_BOT_SECRET` matches between webapp and bot
   - Check bot logs for error details

2. **Database not updated with discordRoleId**
   - Verify Prisma schema includes `discordRoleId` field
   - Check network connectivity between webapp and bot
   - Review API response handling

3. **Multiple Discord servers**
   - Ensure `getAllianceDiscordServers()` returns correct server IDs
   - Verify bot is present in all expected servers
   - Check individual server permission settings

### Debugging Commands

```bash
# Check webapp build
cd webapp && npm run build

# Check bot build  
cd discord-bot && npm run build

# Verify database schema
cd webapp && npx prisma db push

# Test bot connectivity
curl -X POST http://localhost:3001/api/test-connection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret" \
  -d '{"test": "message"}'
```

## Implementation Status

✅ **Completed Features:**
- Enhanced alliance role creation with Discord integration
- Internal bot communication API
- Discord role creation service
- Database schema with discordRoleId field
- Environment variable configuration
- Error handling and logging
- Multi-server support

🔄 **Pending Features:**
- Role deletion sync
- Role update sync  
- Comprehensive testing suite

This implementation provides a solid foundation for bi-directional Discord-website role synchronization, with automatic Discord role creation being the first major component of the sync system.