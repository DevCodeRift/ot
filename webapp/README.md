# Politics & War Alliance Management Platform

A cyberpunk-themed web application for managing Politics & War alliances with Discord integration.

## 🚀 Features

- **Discord OAuth Authentication** - Secure login with Discord
- **Politics & War API Integration** - Link your P&W nation and access alliance data
- **Cyberpunk 2077 Theme** - Authentic cyberpunk styling with neon effects
- **Modular Architecture** - Enable/disable features per alliance
- **Multi-tenant Discord Bot** - Server-isolated bot functionality
- **Real-time Data** - Live alliance member tracking and statistics

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A PostgreSQL database (recommend Neon for easy setup)
- Discord application (already configured)
- Politics & War API key

### 2. Database Setup

1. Create a PostgreSQL database (e.g., on [Neon](https://neon.tech/))
2. Copy your database connection string
3. Update `DATABASE_URL` in `.env.local`

### 3. Environment Variables

The `.env.local` file has been created with your Discord credentials. Update these values:

```env
# Update with your actual database URL
DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Generate a secure secret for production
NEXTAUTH_SECRET="your-super-secret-nextauth-key-change-in-production"

# Add your Politics & War API key
POLITICS_AND_WAR_API_KEY="your-pw-api-key-for-server-requests"

# Add your Discord user ID for admin access
ADMIN_DISCORD_IDS="your-discord-user-id-here"
```

### 4. Install Dependencies & Setup Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 🎮 Discord Application Setup

Your Discord application is already configured with these details:

- **Application ID**: 1414898416949002362
- **OAuth Client ID**: 1414898416949002362
- **OAuth Redirect URL**: Add `http://localhost:3000/api/auth/callback/discord` to your Discord app
- **Bot Token**: Already configured in environment variables

### Adding OAuth Redirect URL

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (ID: 1414898416949002362)
3. Go to OAuth2 → General
4. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. For production, add: `https://your-domain.com/api/auth/callback/discord`

## 🔑 Getting Your Politics & War API Key

1. Go to [Politics & War Account Settings](https://politicsandwar.com/account/)
2. Scroll to the "API Key" section
3. Generate a new API key
4. Copy and paste it when setting up your account in the app

## 📁 Project Structure

```
webapp/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Protected dashboard
│   │   └── setup/          # API key setup
│   ├── components/         # Reusable components
│   │   └── dashboard/      # Dashboard-specific components
│   ├── lib/                # Utility functions
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── prisma.ts       # Database client
│   │   └── politics-war-api.ts # P&W API client
│   └── types/              # TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
└── public/                 # Static assets
```

## 🎨 Cyberpunk Theme

The application uses an authentic Cyberpunk 2077 color scheme:

- **Cyan**: #00f5ff (Primary accent)
- **Yellow**: #fcee0a (Highlights)
- **Red**: #ff003c (Errors/danger)
- **Green**: #00ff9f (Success)
- **Purple**: #b847ca (Secondary)
- **Dark backgrounds** with neon glow effects

## 🔒 Security Features

- **Encrypted API key storage** in database
- **Session-based authentication** with JWT tokens
- **Protected API routes** with user verification
- **Input validation** and sanitization
- **Rate limiting** for external API calls

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Environment Variables for Production

Make sure to update these for production:

- `NEXTAUTH_SECRET`: Generate a secure random string
- `NEXTAUTH_URL`: Your production domain
- `NEXT_PUBLIC_APP_URL`: Your production domain
- `DATABASE_URL`: Production database connection string

## 📚 Next Steps

1. **Set up your database** with the connection string
2. **Add your Discord user ID** to ADMIN_DISCORD_IDS
3. **Get your P&W API key** and add it to the environment
4. **Start the development server** and test the login flow
5. **Begin developing alliance management modules**

## 🛠️ Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations

## 🤝 Contributing

This is a comprehensive alliance management platform. Future modules will include:

- Member Management
- War Coordination
- Economic Tools
- Analytics & Reporting
- Recruitment System
- Administration Panel

Ready to start managing your Politics & War alliance with style! 🚀
