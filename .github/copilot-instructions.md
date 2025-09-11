# GitHub Copilot Instructions for Politics & War Alliance Management Platform

## Project Overview
This is a comprehensive Politics & War alliance management platform consisting of:
- **Vercel Webapp**: Modular web application for alliance management deployed on Vercel
- **Discord Bot**: Multi-tenant Discord bot deployed on Railway for community integration
- **Database**: Neon PostgreSQL database hosted on Vercel for data persistence

The platform serves hundreds of users managing their alliances in the browser game "Politics and War" using the extensive P&W API endpoints.

### Key Architecture Principles
- **Modular Webapp**: Features are organized into modules that can be enabled/disabled per alliance
- **Multi-tenant Discord Bot**: Each Discord server operates independently with isolated data and settings
- **Alliance-based Access Control**: Admin can whitelist alliances for specific modules

## Project Structure
```
/
├── webapp/                 # Next.js web application (deployed to Vercel)
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable React components
│   │   ├── modules/       # Feature modules (member-mgmt, recruitment, etc.)
│   │   ├── lib/           # Utility functions and API clients
│   │   ├── hooks/         # Custom React hooks
│   │   ├── middleware/    # Module access control middleware
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── prisma/            # Database schema and migrations
├── discord-bot/           # Discord bot (deployed to Railway)
│   ├── src/
│   │   ├── commands/      # Discord slash commands
│   │   ├── events/        # Discord event handlers
│   │   ├── services/      # Business logic services
│   │   └── utils/         # Utility functions
│   └── Dockerfile         # Docker configuration for Railway
├── shared/                # Shared utilities and types
│   ├── types/             # Common TypeScript types
│   ├── utils/             # Shared utility functions
│   └── constants/         # Shared constants
└── docs/                  # Documentation
```

## Technology Stack

### Frontend (Webapp)
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components + Cyberpunk 2077 theme
- **State Management**: Zustand or React Query for server state
- **Authentication**: NextAuth.js with Discord OAuth
- **Forms**: React Hook Form with Zod validation
- **Charts/Visualization**: Recharts or Chart.js with cyberpunk styling
- **Typography**: Rajdhani font (Google Fonts) for cyberpunk aesthetic
- **Icons**: Lucide React with custom cyberpunk variants

### Backend (Webapp)
- **API Routes**: Next.js API routes
- **Database ORM**: Prisma
- **Database**: Neon PostgreSQL
- **API Client**: Custom Politics & War API client
- **Validation**: Zod schemas
- **Rate Limiting**: upstash/ratelimit

### Discord Bot
- **Framework**: Discord.js v14+
- **Language**: TypeScript
- **Deployment**: Railway with Docker
- **Process Manager**: PM2 (if needed)
- **Database**: Shared Neon PostgreSQL via Prisma

### Infrastructure
- **Webapp Deployment**: Vercel
- **Bot Deployment**: Railway
- **Database**: Vercel Neon PostgreSQL
- **Environment**: Environment variables for all secrets

## Politics & War API Integration

### Key API Endpoints to Utilize
- Nations API (`/nations`)
- Alliances API (`/alliances`)
- Alliance Members API (`/alliance-members`)
- Wars API (`/wars`)
- Cities API (`/cities`)
- Trades API (`/trades`)
- Banks API (`/alliance-bank`)
- Tax Records API (`/tax-records`)

### API Client Guidelines
- Implement proper rate limiting (P&W has strict limits)
- Use caching for frequently accessed data
- Handle API errors gracefully
- Implement retry logic with exponential backoff
- Store API keys securely in environment variables

## Database Schema Considerations

### Core Entities
- **Users**: Discord ID, P&W nation ID, alliance affiliations
- **Alliances**: Alliance data from P&W API
- **Nations**: Nation data and historical tracking
- **Wars**: War data and tracking
- **Bank Transactions**: Alliance bank records
- **Tax Records**: Member tax contributions
- **Modules**: Available feature modules (member-mgmt, recruitment, etc.)
- **Alliance_Modules**: Junction table for alliance access to specific modules
- **Discord_Servers**: Discord server configurations and settings
- **Bot_Settings**: Per-server bot configuration and permissions
- **Audit Logs**: Track administrative actions

### Relationships
- Users can belong to multiple alliances over time
- Nations belong to users and alliances
- Wars involve multiple nations
- Bank transactions are tied to alliances and nations

## Authentication & Authorization

### Web Application
- Use NextAuth.js with Discord OAuth provider
- Link Discord accounts to P&W nation IDs
- Implement role-based access control (RBAC)
- Support multiple alliance memberships

### Discord Bot
- Use Discord application commands (slash commands)
- Implement per-server data isolation (multi-tenant architecture)
- Allow server admins to manage bot settings independently
- Implement permission checks based on Discord roles
- Sync permissions with webapp user roles per alliance/server
- Store server-specific configurations and settings

## Key Features to Implement

### Web Application Features

#### Core Features (Always Available)
1. **Alliance Dashboard**
   - Basic member overview
   - Alliance information display
   - User authentication and profile

#### Modular Features (Admin Whitelisted)
1. **Member Management Module**
   - Member recruitment tracking
   - Activity monitoring
   - Role assignment
   - Performance analytics
   - Member onboarding workflows

2. **War Management Module**
   - War declaration tracking
   - Battle coordination
   - Target assignment
   - Damage tracking
   - War planning tools

3. **Economic Tools Module**
   - Alliance bank management
   - Tax collection tracking
   - Trade management
   - Resource tracking
   - Tax optimization
   - Bank audit tools

4. **Analytics & Reporting Module**
   - Alliance growth metrics
   - Member performance reports
   - Economic analysis
   - War statistics
   - Custom report generation

5. **Recruitment Module**
   - Application management
   - Recruitment campaigns
   - Candidate tracking
   - Interview scheduling

6. **Administration Module**
   - User role management
   - Alliance settings
   - Audit logs
   - System configuration

### Discord Bot Features

#### Per-Server Configuration
- Each Discord server has independent bot configuration
- Server admins can enable/disable specific command categories
- Bot data is isolated per server (no cross-server information sharing)
- Customizable command permissions based on Discord roles

#### Core Commands (Always Available)
1. **Information Commands**
   - Nation lookup (`/nation [name/id]`)
   - Alliance info (`/alliance [name/id]`)
   - Server settings (`/settings`)

#### Module-Based Commands (Based on Alliance Access)
1. **Member Management Commands**
   - Member activity (`/activity [member]`)
   - Member stats (`/member-stats [member]`)
   - Role assignments (`/assign-role [member] [role]`)

2. **War Management Commands**
   - War status (`/wars [alliance]`)
   - War updates (`/war-update`)
   - Target assignments (`/assign-target [member] [target]`)

3. **Economic Commands**
   - Tax reminders (`/tax-reminder`)
   - Bank status (`/bank-status`)
   - Resource tracking (`/resources`)

4. **Integration Commands**
   - Sync webapp data (`/sync`)
   - Generate reports (`/report [type]`)
   - Quick statistics (`/stats`)

5. **Administrative Commands**
   - Bot configuration (`/config`)
   - Permission management (`/permissions`)
   - Server setup (`/setup`)

## Cyberpunk 2077 Theme Design System

### Color Palette
```css
/* Primary Cyberpunk Colors */
--cp-cyan: #00f5ff;           /* Bright cyan accent */
--cp-yellow: #fcee0a;         /* Vibrant yellow highlights */
--cp-red: #ff003c;            /* Error/danger red */
--cp-green: #00ff9f;          /* Success/active green */
--cp-purple: #b847ca;         /* Secondary purple */
--cp-orange: #ff6b35;         /* Warning orange */

/* Background Colors */
--cp-bg-primary: #0f0f0f;     /* Main dark background */
--cp-bg-secondary: #1a1a1a;   /* Card/section backgrounds */
--cp-bg-tertiary: #252525;    /* Elevated surfaces */
--cp-bg-accent: #2a2a2a;      /* Interactive elements */

/* Text Colors */
--cp-text-primary: #ffffff;    /* Main text */
--cp-text-secondary: #b3b3b3;  /* Secondary text */
--cp-text-muted: #666666;      /* Muted text */
--cp-text-accent: #00f5ff;     /* Accent text */

/* Border & Outline Colors */
--cp-border: #333333;          /* Default borders */
--cp-border-accent: #00f5ff;   /* Highlighted borders */
--cp-glow: 0 0 10px #00f5ff;   /* Neon glow effect */
```

### Typography System
```css
/* Import Rajdhani font */
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');

/* Font hierarchy */
--cp-font-primary: 'Rajdhani', 'Arial', sans-serif;
--cp-font-mono: 'JetBrains Mono', 'Consolas', monospace;

/* Font weights */
--cp-font-light: 300;
--cp-font-regular: 400;
--cp-font-medium: 500;
--cp-font-semibold: 600;
--cp-font-bold: 700;
```

### Component Design Principles

#### Cards & Containers
- Dark backgrounds with subtle borders
- Neon glow effects on hover/active states
- Sharp corners with minimal border radius (2-4px max)
- Subtle background gradients or noise textures
- State-based color overlays (cyan for active, red for errors)

#### Interactive Elements
```css
/* Button States */
.cp-button {
  background: linear-gradient(145deg, #1a1a1a, #252525);
  border: 1px solid var(--cp-border);
  color: var(--cp-text-primary);
  transition: all 0.3s ease;
}

.cp-button:hover {
  border-color: var(--cp-cyan);
  box-shadow: var(--cp-glow);
  color: var(--cp-cyan);
}

.cp-button:active {
  background: var(--cp-cyan);
  color: var(--cp-bg-primary);
}
```

#### Navigation & Sidebar
- Dark sidebar with cyan accents for active items
- Subtle hover states with glow effects
- Icon + text combinations with proper spacing
- Collapsible sections with smooth animations

#### Data Visualization
- Use cyberpunk color palette for charts
- Glowing data points and lines
- Dark chart backgrounds
- Neon grid lines and labels
- Animated transitions and hover effects

#### Form Elements
- Dark input backgrounds with cyan focus states
- Glowing borders on active fields
- Custom styled dropdowns and selects
- Validation states using red/green accent colors

### Layout Patterns

#### Dashboard Layout
```jsx
// Main dashboard structure
<div className="cp-dashboard">
  <aside className="cp-sidebar">
    {/* Navigation with glowing active states */}
  </aside>
  <main className="cp-main-content">
    <header className="cp-header">
      {/* Breadcrumbs and user info */}
    </header>
    <div className="cp-content-grid">
      {/* Module cards with hover effects */}
    </div>
  </main>
</div>
```

#### Module Cards
- Consistent card sizing and spacing
- Hover states with subtle animations
- Status indicators using color coding
- Action buttons with cyberpunk styling

### Animation & Effects

#### Micro-interactions
- Subtle glow animations on hover
- Smooth transitions (0.3s ease)
- Loading states with cyberpunk spinners
- State changes with color transitions

#### Loading States
```css
.cp-loading {
  background: linear-gradient(90deg, transparent, var(--cp-cyan), transparent);
  animation: cyber-scan 2s infinite;
}

@keyframes cyber-scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Responsive Design
- Mobile-first approach with cyberpunk aesthetics
- Collapsible sidebar for mobile
- Touch-friendly button sizes (44px minimum)
- Consistent spacing using 8px grid system

### Accessibility Considerations
- High contrast ratios with dark theme
- Focus indicators using cyan glow
- Screen reader friendly navigation
- Keyboard navigation support
- Alternative text for all visual elements

### Implementation Guidelines

#### Tailwind Configuration
```js
// tailwind.config.js extensions
module.exports = {
  theme: {
    extend: {
      colors: {
        'cp-cyan': '#00f5ff',
        'cp-yellow': '#fcee0a',
        'cp-red': '#ff003c',
        // ... other cyberpunk colors
      },
      fontFamily: {
        'cyberpunk': ['Rajdhani', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'cp-glow': '0 0 10px #00f5ff',
        'cp-glow-lg': '0 0 20px #00f5ff',
      }
    }
  }
}
```

#### Component Libraries
- Extend shadcn/ui components with cyberpunk styling
- Create custom variants for all interactive elements
- Maintain consistent theming across all modules
- Use CSS custom properties for dynamic theming

## Module System Architecture

### Webapp Module Structure
```typescript
// Module Definition
interface Module {
  id: string;
  name: string;
  description: string;
  requiredPermissions: string[];
  component: React.ComponentType;
  routes: ModuleRoute[];
}

// Module Access Control
const checkModuleAccess = async (allianceId: number, moduleId: string) => {
  return await prisma.alliance_modules.findFirst({
    where: { alliance_id: allianceId, module_id: moduleId, enabled: true }
  });
};
```

### Discord Bot Multi-Tenant Pattern
```typescript
// Server-Specific Configuration
interface ServerConfig {
  serverId: string;
  allianceId?: number;
  enabledModules: string[];
  commandPermissions: Record<string, string[]>;
  customSettings: Record<string, any>;
}

// Command with Server Isolation
export const createServerCommand = (commandDef: CommandDefinition) => ({
  ...commandDef,
  execute: async (interaction: CommandInteraction) => {
    const serverConfig = await getServerConfig(interaction.guildId);
    // Execute with server-specific context
  }
});
```

### Module Registration System
```typescript
// Register modules dynamically
const moduleRegistry = new Map<string, Module>();

export const registerModule = (module: Module) => {
  moduleRegistry.set(module.id, module);
};

export const getAvailableModules = (allianceId: number) => {
  // Return modules based on alliance whitelist
};
```

## Code Style & Conventions

### General Guidelines
- Use TypeScript strictly with proper typing
- Follow ESLint and Prettier configurations
- Implement comprehensive error handling
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React Components
- Use functional components with hooks
- Implement proper prop typing with TypeScript
- Use React.memo for performance optimization
- Follow the compound component pattern where appropriate

### API Development
- Use proper HTTP status codes
- Implement request validation with Zod
- Add proper error responses
- Use consistent API response formats

### Database Operations
- Use Prisma transactions for multi-table operations
- Implement proper error handling for DB operations
- Use connection pooling appropriately
- Add proper indexes for query optimization

## Security Considerations

### API Security
- Validate all inputs with Zod schemas
- Implement rate limiting on all endpoints
- Use CORS properly for the webapp
- Sanitize all user inputs

### Authentication
- Store JWT tokens securely
- Implement proper session management
- Use HTTPS in production
- Validate Discord OAuth tokens

### Data Protection
- Hash sensitive data where appropriate
- Implement audit logging for admin actions
- Use environment variables for all secrets
- Follow GDPR compliance for user data

## Performance Optimization

### Frontend
- Implement code splitting
- Use Next.js Image optimization
- Implement proper caching strategies
- Use React Query for server state management

### Backend
- Cache frequently accessed P&W API data
- Use database indexes appropriately
- Implement query optimization
- Use CDN for static assets

### Discord Bot
- Implement command cooldowns per server
- Cache Discord API responses with server isolation
- Use efficient database queries with proper indexing
- Implement proper error recovery and fallbacks
- Isolate data between Discord servers completely

## Environment Variables

### Webapp (.env.local)
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
POLITICS_AND_WAR_API_KEY="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_DISCORD_IDS="123456789,987654321"  # For module management
```

### Discord Bot (.env)
```
DISCORD_BOT_TOKEN="..."
DATABASE_URL="postgresql://..."
WEBAPP_API_URL="https://your-app.vercel.app"
POLITICS_AND_WAR_API_KEY="..."
BOT_CLIENT_ID="..."  # For invite links
ENCRYPTION_KEY="..."  # For server-specific data encryption
```

## Development Workflow

### Getting Started
1. Set up the workspace with proper folder structure
2. Initialize both webapp and bot with their respective package.json files
3. Set up Prisma schema and database migrations
4. Configure environment variables
5. Implement basic authentication flow

### Deployment Process
1. **Webapp**: Push to main branch triggers Vercel deployment
2. **Discord Bot**: Push to main branch triggers Railway deployment
3. **Database**: Run migrations through Vercel dashboard or CLI

## Testing Strategy

### Unit Testing
- Use Jest for utility functions
- Test React components with React Testing Library
- Mock external API calls
- Test database operations with test database

### Integration Testing
- Test API endpoints with supertest
- Test Discord bot commands
- Test P&W API integration
- Test authentication flows

## Common Patterns & Best Practices

### Error Handling
```typescript
// API Route Error Handling
try {
  const result = await politicsAndWarApi.getNation(nationId);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof PoliticsAndWarApiError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### Discord Command Structure
```typescript
// Discord Slash Command
export const nationCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('nation')
    .setDescription('Get information about a nation')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nation name or ID')
        .setRequired(true)
    ),
  execute: async (interaction) => {
    // Command logic here
  }
};
```

### Database Queries with Caching
```typescript
// Cached database query
const getAllianceMembers = cache(async (allianceId: number) => {
  return await prisma.nation.findMany({
    where: { alliance_id: allianceId },
    include: { user: true }
  });
});
```

## Monitoring & Logging

### Application Monitoring
- Use Vercel Analytics for webapp performance
- Implement custom logging for Discord bot
- Monitor P&W API rate limits
- Track database query performance

### Error Tracking
- Use Sentry or similar for error tracking
- Implement structured logging
- Monitor deployment health
- Set up alerts for critical errors

## Documentation Requirements
- Maintain API documentation
- Document Discord bot commands
- Keep deployment instructions updated
- Document environment setup process

## Cyberpunk Theme Implementation Notes

### Critical Design Requirements
- **Dark Theme Only**: All interfaces must use dark backgrounds with cyberpunk accents
- **Consistent Glow Effects**: Active states and interactive elements should have cyan glow
- **Rajdhani Typography**: Use Rajdhani font throughout for authentic cyberpunk feel
- **Sharp UI Elements**: Minimal border radius, sharp corners, and clean lines
- **Color-Coded States**: Use cyberpunk color palette for different states (cyan=active, red=error, green=success)

### Component Development Guidelines
1. **Every Component**: Must follow cyberpunk design system
2. **Interactive States**: Implement hover, active, and focus states with appropriate glows
3. **Data Visualization**: Charts and graphs should use cyberpunk colors and styling
4. **Form Elements**: Custom styled inputs, dropdowns, and buttons matching theme
5. **Loading States**: Implement cyberpunk-style loading animations and spinners

### Module-Specific Theming
- **Member Management**: Use green accents for active members, red for inactive
- **War Management**: Red/orange color scheme for war-related data
- **Economic Tools**: Yellow/green for positive metrics, red for negative
- **Analytics**: Multi-color cyberpunk palette for different data series
- **Recruitment**: Cyan/blue theme for candidate tracking

### Performance Considerations
- Optimize glow effects for performance
- Use CSS transforms for animations
- Implement proper dark mode without flicker
- Ensure smooth transitions on all interactive elements

Remember to always prioritize user experience, security, and performance while maintaining the authentic Cyberpunk 2077 aesthetic throughout the Politics & War alliance management platform.
