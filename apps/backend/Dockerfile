# syntax=docker/dockerfile:1

# Stage 1: Base
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Stage 2: Dependencies (production only)
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
RUN pnpm install --frozen-lockfile --prod --filter @gsd/backend...

# Stage 3: Build
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend ./apps/backend
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @gsd/backend...
RUN cd apps/backend && pnpm prisma generate
RUN pnpm --filter @gsd/backend build

# Stage 4: Production
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace files
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy node_modules from build stage (includes generated Prisma client)
COPY --from=build /app/node_modules ./node_modules

# Copy packages
COPY --from=build /app/packages ./packages

# Copy backend application
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/apps/backend/node_modules ./apps/backend/node_modules

# Security: Use non-root user
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/ready', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "apps/backend/dist/main.js"]
