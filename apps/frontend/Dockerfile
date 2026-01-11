# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

# Install all dependencies (needed for building workspace packages)
RUN pnpm install --frozen-lockfile

# Build workspace packages first (required for frontend compilation)
RUN pnpm --filter "./packages/*" build

# Build frontend
RUN pnpm --filter @gsd/frontend build

# Stage 2: Production (Nginx)
FROM nginx:alpine AS production

# Copy static files
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Security: Run as non-root (nginx already runs as nginx user)

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
