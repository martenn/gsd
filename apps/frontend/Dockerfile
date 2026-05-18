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

# PUBLIC_API_URL is inlined by Astro/Vite at build time and cannot be changed
# at runtime. Must be supplied as a build-arg in CI / docker-compose.
ARG PUBLIC_API_URL=http://localhost:3000
ENV PUBLIC_API_URL=${PUBLIC_API_URL}

# Build frontend
RUN pnpm --filter @gsd/frontend build

# Stage 2: Production (Nginx, unprivileged for LXC/host-net hosts)
FROM nginxinc/nginx-unprivileged:alpine AS production

# Copy static files
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Image already runs as UID 101 (nginx). Bound to unprivileged port 8082
# because the LXC target host blocks binds < 1024 inside containers.
EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8082/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
