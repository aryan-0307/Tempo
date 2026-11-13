# ==============================================================================
# Tempo Production Dockerfile
# Multi-stage lightweight Node.js container
# ==============================================================================

FROM node:20-alpine AS base
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose HTTP port
EXPOSE 3000

# Non-root user for container security
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start production server
CMD ["node", "server/server.js"]

