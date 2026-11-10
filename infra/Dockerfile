# ============================================================================
# CipherLab Production Multi-Stage Dockerfile
# Node.js 22 LTS on Alpine Linux
# Strictly runs as non-root user (nodejs:nodejs)
# ============================================================================

# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install build tools if needed
RUN apk add --no-cache libc6-compat openssl

# Copy root and workspace package files
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY . .

# Generate Prisma Client for PostgreSQL
WORKDIR /app/server
RUN npx prisma generate
WORKDIR /app

# Build shared contracts, server, and frontend
RUN npm run build:server
RUN npm run build

# ── Stage 3: Production Runner ───────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Install openssl for Prisma runtime and dumb-init for proper signal handling
RUN apk add --no-cache openssl dumb-init curl

# Create non-root system user and group
RUN addgroup --system --gid 10001 nodejs && \
    adduser --system --uid 10001 --ingroup nodejs nodejs

ENV NODE_ENV=production
ENV PORT=3001

# Copy production node_modules and Prisma runtime
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/prisma ./server/prisma
COPY --from=builder --chown=nodejs:nodejs /app/server/package.json ./server/
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to unprivileged non-root user
USER nodejs

# Container port
EXPOSE 3001

# Healthcheck against API health endpoint
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/healthz || exit 1

# dumb-init ensures SIGTERM and SIGINT are forwarded correctly to Node.js
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/dist/server/src/index.js"]

