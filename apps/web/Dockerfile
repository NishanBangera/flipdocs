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

# Save root config files before pruning
RUN cp tsconfig.json tsconfig.json.backup
RUN cp turbo.json turbo.json.backup

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
# Copy bun.lockb if it exists, otherwise skip
RUN if [ -f /app/out/bun.lockb ]; then cp /app/out/bun.lockb ./; fi
RUN bun install

# Copy source code of isolated subworkspace
COPY --from=deps /app/out/full/ .

# Copy root configuration files from backup
COPY --from=deps /app/tsconfig.json.backup ./tsconfig.json
COPY --from=deps /app/turbo.json.backup ./turbo.json

# Set build-time environment variables to prevent build failures
# These are placeholder values only for build time
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_build_placeholder"
ENV NEXT_PUBLIC_SUPABASE_URL="https://build.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="build_placeholder"
ENV DATABASE_URL="postgresql://build:placeholder@localhost:5432/build"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_API_URL="http://localhost:3001"
# Note: CLERK_SECRET_KEY removed from build env for security

# Build the project
RUN turbo build --filter=@flipdocs/web...

FROM base AS runner
WORKDIR /app

# Copy the built application
COPY --from=installer /app/apps/web/next.config.ts ./apps/web/
COPY --from=installer /app/apps/web/package.json ./apps/web/
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "apps/web/server.js"]