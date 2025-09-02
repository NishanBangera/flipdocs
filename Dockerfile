# Use the official Bun image as the base image for building
FROM oven/bun:1 as builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and bun.lock (if exists) to the working directory
COPY package.json bun.lock* ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy the source code to the working directory
COPY . .

# Build the application
RUN bun run build

# Production stage - use a smaller Node.js image
FROM node:18-alpine as production

# Install bun in the production image
RUN npm install -g bun

# Set the working directory inside the container
WORKDIR /app

# Copy package.json for production dependencies
COPY package.json ./

# Install only production dependencies using npm (fallback if bun not available)
RUN npm install --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy any other necessary files (like .env template)
COPY --from=builder /app/src ./src

# Expose the port the app runs on
EXPOSE 3001

# Set environment variables (these will be overridden by your hosting service)
ENV NODE_ENV=production
ENV PORT=3001

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Command to run the application
CMD ["bun", "run", "start"]