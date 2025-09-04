# Multi-stage Dockerfile for Next.js app in Turborepo with Bun
FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y libc6-dev
WORKDIR /app

# Install Turbo
RUN bun install -g turbo

# Copy the entire monorepo
COPY . .

# Generate a partial monorepo with a pruned lockfile for the web app
RUN turbo prune @flipdocs/web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apt-get update && apt-get install -y libc6-dev
WORKDIR /app

# Install Turbo
RUN bun install -g turbo

# First install the dependencies (this is done before copying the source code to better leverage Docker layer caching)
COPY --from=deps /app/out/json/ .
# Copy root configuration files
COPY --from=deps /app/out/full/tsconfig.json ./tsconfig.json
COPY --from=deps /app/out/full/turbo.json ./turbo.json
# Copy bun.lockb if it exists, otherwise skip
RUN if [ -f /app/out/bun.lockb ]; then cp /app/out/bun.lockb ./; fi
RUN bun install

# Copy source code of isolated subworkspace
COPY --from=deps /app/out/full/ .

# Build the project
RUN turbo build --filter=@flipdocs/web...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=installer /app/apps/web/next.config.ts ./apps/web/
COPY --from=installer /app/apps/web/package.json ./apps/web/
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "apps/web/server.js"]