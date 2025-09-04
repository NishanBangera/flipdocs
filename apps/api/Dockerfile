# Multi-stage Dockerfile for ElysiaJS API with Bun in Turborepo
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Install Turbo
RUN bun install -g turbo

# Copy the entire monorepo
COPY . .

# Generate a partial monorepo with a pruned lockfile for the API
RUN turbo prune @flipdocs/api --docker

# Build stage
FROM base AS builder
WORKDIR /app

# Install Turbo
RUN bun install -g turbo

# Copy dependency files
COPY --from=deps /app/out/json/ .

# Copy bun.lockb if it exists
RUN if [ -f /app/out/bun.lockb ]; then cp /app/out/bun.lockb ./; fi

# Install dependencies
RUN bun install

# Copy source code
COPY --from=deps /app/out/full/ .

# Build the API
RUN turbo build --filter=@flipdocs/api...

# Production stage
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs elysiajs

# Copy the built application
COPY --from=builder --chown=elysiajs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=elysiajs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=elysiajs:nodejs /app/node_modules ./node_modules

USER elysiajs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/apps/api

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# Start the application
CMD ["bun", "run", "dist/index.js"]