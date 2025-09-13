# Politics & War Alliance Discord Bot

A multi-tenant Discord bot for the Politics & War Alliance Management Platform, deployed on Railway.

## Features

- **Multi-tenant Architecture**: Each Discord server operates independently with isolated data
- **Alliance Integration**: Connects with the main webapp for alliance management
- **Role-based Permissions**: Commands restricted based on Discord roles and alliance roles
- **Real-time Communication**: API endpoints for webapp integration
- **Slash Commands**: Modern Discord interaction patterns

## Quick Start

### Prerequisites

- Node.js 18+
- Discord Bot Token
- Database URL (shared with webapp)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Railway Deployment

The bot is configured for automatic deployment on Railway:

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

## Project Structure

```
discord-bot/
├── src/
│   ├── commands/        # Discord slash commands
│   ├── events/          # Discord event handlers
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript definitions
│   └── index.ts         # Main bot entry point
├── prisma/
│   └── schema.prisma    # Database schema (shared with webapp)
├── Dockerfile           # Railway deployment configuration
└── package.json
```

## Commands

- `/ping` - Test bot responsiveness
- `/test-webapp` - Test connection to alliance webapp
- More commands coming soon...

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_BOT_TOKEN` | Discord bot token | Yes |
| `DISCORD_CLIENT_ID` | Discord application client ID | Yes |
| `DATABASE_URL` | PostgreSQL database URL | Yes |
| `WEBAPP_API_URL` | Alliance webapp URL | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 3001) | No |

## API Endpoints

- `GET /health` - Health check
- `POST /api/test-connection` - Webapp communication test

## Multi-tenant Architecture

Each Discord server has:
- Independent configuration
- Isolated data storage
- Custom permission settings
- Alliance-specific features

## Development

### Adding Commands

1. Create command file in `src/commands/`
2. Export SlashCommand object with data and execute function
3. Commands are auto-loaded on startup

### Adding Events

1. Create event file in `src/events/`
2. Export event object with name and execute function
3. Events are auto-loaded on startup

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details