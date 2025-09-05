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

# Save root config files before pruning
RUN cp tsconfig.json tsconfig.json.backup
RUN cp turbo.json turbo.json.backup

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

# Copy root configuration files from backup
COPY --from=deps /app/tsconfig.json.backup ./tsconfig.json
COPY --from=deps /app/turbo.json.backup ./turbo.json

# Build the API
RUN turbo build --filter=@flipdocs/api...

# Production stage
FROM base AS runner
WORKDIR /app

# Copy the built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/apps/api

# Start the application
CMD ["bun", "run", "dist/server.js"]