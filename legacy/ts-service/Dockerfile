# =============================================================================
# TypeScript NestJS Service - Multi-stage Dockerfile
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage - Shared dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# -----------------------------------------------------------------------------
# Development Stage - Hot reload enabled
# -----------------------------------------------------------------------------
FROM base AS development
ENV NODE_ENV=development

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies (including devDependencies)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 9229

# Start development server with hot reload
CMD ["yarn", "start:dev"]

# -----------------------------------------------------------------------------
# Build Stage - Compile TypeScript
# -----------------------------------------------------------------------------
FROM base AS build
ENV NODE_ENV=production

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build the application
RUN yarn build

# -----------------------------------------------------------------------------
# Production Stage - Optimized runtime
# -----------------------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true && \
    yarn cache clean

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]
