# syntax=docker/dockerfile:1

# Stage 1: Base
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Stage 2: Build
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend ./apps/backend
COPY packages ./packages

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build workspace packages first (required for backend compilation)
RUN pnpm --filter "./packages/*" build

# Generate Prisma client
RUN cd apps/backend && pnpm prisma generate

# Build backend
RUN pnpm --filter @gsd/backend build

# Stage 3: Production
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/validation/package.json ./packages/validation/package.json

# Copy built workspace packages
COPY --from=build /app/packages ./packages

# Copy Prisma schema BEFORE install so postinstall hook can generate client
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma

# Install production dependencies using pnpm
RUN pnpm install --frozen-lockfile --prod --shamefully-hoist

# Copy generated Prisma client from build stage (includes .prisma generated code)
# Copy the entire @prisma/client package with generated code embedded
COPY --from=build /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma ./node_modules/.pnpm/@prisma+client@6.17.1_prisma@6.17.1_magicast@0.3.5_typescript@5.9.3__typescript@5.9.3/node_modules/.prisma

# Copy built application
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

# Security: Use non-root user
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/ready', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "apps/backend/dist/src/main.js"]
