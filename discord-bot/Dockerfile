# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for building (including Python for some native modules)
RUN apk add --no-cache python3 make g++

# Copy package files and Prisma schema before installing dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma/ ./prisma/

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Generate Prisma client (now that schema is available)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source files to reduce image size
RUN npm ci --only=production && rm -rf src/ tsconfig.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S discord-bot -u 1001

# Create logs directory
RUN mkdir -p logs && chown -R discord-bot:nodejs logs

# Switch to non-root user
USER discord-bot

# Expose port for health checks and API communication
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the bot
CMD ["npm", "start"]