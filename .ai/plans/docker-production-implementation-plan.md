# Feature Implementation Plan: Docker Production Images

## 1. Feature Overview

Create optimized, production-ready Docker images for the GSD application using multi-stage builds, security best practices, and minimal image sizes. This plan covers:

- **Backend Docker image:** NestJS API server
- **Frontend Docker image:** Astro static site with React islands
- **Multi-stage builds:** Separate build and runtime stages for efficiency
- **Security hardening:** Non-root users, minimal attack surface, security scanning
- **Docker Compose:** Production-ready orchestration for local deployment
- **CI/CD integration:** Automated image builds and registry pushes

The production images will be deployable to any container orchestration platform (Kubernetes, Docker Swarm, ECS) or cloud provider (AWS, GCP, Azure).

## 2. Inputs

### Build Context

- Source code from monorepo: `apps/backend/`, `apps/frontend/`, `packages/`
- Dependencies: `package.json`, `pnpm-lock.yaml`
- Configuration files: `.env.example`, `tsconfig.json`, Prisma schema
- Build artifacts: Compiled TypeScript, bundled frontend assets

### Build Arguments

- `NODE_VERSION`: Node.js version (default: 20-alpine)
- `PNPM_VERSION`: pnpm version (default: 8.15.0)
- `PORT`: Application port (backend: 3000, frontend: 4321)
- Build-time secrets: None (use runtime environment variables)

### Environment Variables (Runtime)

**Backend:**

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`

**Frontend:**

- `NODE_ENV=production`
- `PORT=4321`
- `PUBLIC_API_URL` (backend API URL)

## 3. Used Files

### Backend Dockerfile

- `apps/backend/Dockerfile`
- `apps/backend/.dockerignore`

### Frontend Dockerfile

- `apps/frontend/Dockerfile`
- `apps/frontend/.dockerignore`

### Docker Compose

- `docker-compose.yml` (development - already exists)
- `docker-compose.prod.yml` (production)

### CI/CD

- `.github/workflows/docker-build.yml` (build and push images)

## 4. Outputs

### Backend Docker Image

- **Image name:** `gsd-backend:latest`
- **Size target:** <200MB (Alpine-based)
- **Exposed port:** 3000
- **Health check:** `/health/ready`
- **User:** Non-root (`node` user)
- **Registry:** GitHub Container Registry (ghcr.io) or Docker Hub

### Frontend Docker Image

- **Image name:** `gsd-frontend:latest`
- **Size target:** <100MB (Nginx + static files)
- **Exposed port:** 80 (Nginx) or 4321 (Node SSR)
- **Health check:** HTTP GET /
- **User:** Non-root (`nginx` or `node` user)
- **Registry:** GitHub Container Registry (ghcr.io) or Docker Hub

### Image Tags

- `latest` - Latest production build
- `{git-sha}` - Specific commit (e.g., `abc123f`)
- `{version}` - Semantic version (e.g., `v1.0.0`)

## 5. Data Flow

### Build Process Flow

#### Backend Image Build

1. **Stage 1 (base):** Install pnpm and setup base dependencies
2. **Stage 2 (dependencies):** Install production dependencies only
3. **Stage 3 (build):** Install all dependencies, build TypeScript
4. **Stage 4 (production):** Copy production dependencies and build artifacts
5. Run Prisma client generation
6. Set non-root user
7. Configure health check
8. Set entrypoint and command

#### Frontend Image Build

1. **Stage 1 (base):** Install pnpm and setup base dependencies
2. **Stage 2 (dependencies):** Install production dependencies only
3. **Stage 3 (build):** Install all dependencies, build Astro site
4. **Stage 4 (production):** Copy static files to Nginx or Node runtime
5. Configure Nginx (if using static hosting)
6. Set non-root user
7. Set entrypoint and command

### Deployment Flow

1. Build Docker images locally or in CI/CD
2. Push images to container registry
3. Pull images on target environment
4. Run containers with environment variables
5. Health checks verify readiness
6. Load balancer routes traffic to healthy containers

## 6. Security Considerations

### Image Security Best Practices

#### Use Minimal Base Images

- **Alpine Linux:** Smallest attack surface, minimal packages
- Avoid full Ubuntu/Debian images (too large, unnecessary packages)
- Use official Node.js Alpine images: `node:20-alpine`

#### Non-Root User

- Never run containers as root
- Create and use dedicated user (e.g., `node`, `nginx`)
- Set user in Dockerfile: `USER node`
- Ensure file permissions allow non-root access

#### Multi-Stage Builds

- Separate build tools from runtime
- Only include production dependencies in final image
- Reduces image size and attack surface

#### Secret Management

- **Never** hardcode secrets in Dockerfile or image
- Use runtime environment variables
- Consider secret management tools (Vault, AWS Secrets Manager)
- Use `.dockerignore` to prevent secret leakage

#### Vulnerability Scanning

- Scan images for vulnerabilities: `docker scan` or Trivy
- Fix high/critical vulnerabilities before deployment
- Automate scanning in CI/CD pipeline
- Monitor base image updates

#### Read-Only Filesystem

- Run containers with read-only root filesystem (where possible)
- Use volumes for writable data (logs, uploads)
- Reduces attack surface (prevents runtime tampering)

#### Network Security

- Expose only necessary ports
- Use internal networks for service-to-service communication
- Never expose database directly

### Dockerfile Security Checklist

- ✅ Use official base images
- ✅ Specify exact image versions (avoid `latest` tag in production)
- ✅ Run as non-root user
- ✅ Use multi-stage builds
- ✅ Copy only necessary files
- ✅ No secrets in image layers
- ✅ Minimize installed packages
- ✅ Use `.dockerignore`
- ✅ Set health checks
- ✅ Scan for vulnerabilities

## 7. Error Handling

### Build Failures

| Error Scenario                 | Cause                                | Solution                                        |
| ------------------------------ | ------------------------------------ | ----------------------------------------------- |
| Dependency installation fails  | Network issue, invalid package       | Check pnpm-lock.yaml, retry build               |
| TypeScript compilation errors  | Type errors in code                  | Fix TypeScript errors, rebuild                  |
| Prisma client generation fails | Invalid schema, missing DATABASE_URL | Ensure schema is valid, provide placeholder URL |
| Out of disk space              | Large build artifacts                | Clean Docker build cache, increase disk         |
| Build timeout                  | Slow network, large dependencies     | Increase timeout, use build cache               |

### Runtime Failures

| Error Scenario              | Cause                           | Solution                                          |
| --------------------------- | ------------------------------- | ------------------------------------------------- |
| Container exits immediately | Missing env vars, startup error | Check logs, verify env vars                       |
| Health check fails          | App not ready, DB unreachable   | Check health endpoint, DB connectivity            |
| Permission denied           | File permissions, non-root user | Fix file ownership in Dockerfile                  |
| Port already in use         | Port conflict                   | Change exposed port or stop conflicting container |

### Debugging Strategies

- Run container interactively: `docker run -it --entrypoint sh gsd-backend`
- Check container logs: `docker logs <container-id>`
- Inspect environment: `docker exec <container-id> env`
- Verify file permissions: `docker exec <container-id> ls -la`

## 8. Performance Considerations

### Image Size Optimization

**Target Sizes:**

- Backend: <200MB
- Frontend (static): <100MB
- Frontend (SSR): <150MB

**Optimization Techniques:**

- Multi-stage builds (exclude build tools)
- Production dependencies only (`pnpm install --prod`)
- Remove unnecessary files (docs, tests, dev configs)
- Compress static assets (Gzip, Brotli)
- Use `.dockerignore` aggressively

### Build Time Optimization

**Target Build Times:**

- Backend: <5 minutes
- Frontend: <3 minutes

**Optimization Techniques:**

- Layer caching (order Dockerfile commands for best caching)
- Cache dependencies layer (copy package.json before source code)
- Use BuildKit for parallel builds
- Use pnpm's fetch cache
- Pre-build base images with common dependencies

### Runtime Performance

- Use Alpine Linux (smaller, faster container startup)
- Enable production mode optimizations (NODE_ENV=production)
- Use process managers (PM2, or native Node clustering) if needed
- Configure resource limits (memory, CPU) in orchestrator

### Build Cache Strategy

1. Copy `package.json` and `pnpm-lock.yaml` first (least frequently changed)
2. Install dependencies (cached if lock file unchanged)
3. Copy source code (most frequently changed)
4. Build application
5. Cache layers 1-2 for fast rebuilds

## 9. Implementation Steps

### Step 1: Create .dockerignore files

1. Create `apps/backend/.dockerignore`:
   ```
   node_modules
   dist
   .env
   .env.*
   *.log
   coverage
   .git
   .github
   README.md
   test
   ```
2. Create `apps/frontend/.dockerignore`:
   ```
   node_modules
   dist
   .astro
   .env
   .env.*
   *.log
   coverage
   .git
   .github
   README.md
   ```

### Step 2: Create backend Dockerfile

1. Create `apps/backend/Dockerfile`:
   - **Stage 1 (base):** FROM node:20-alpine, install pnpm globally
   - **Stage 2 (dependencies):** Copy package files, install prod deps
   - **Stage 3 (build):** Copy all files, install all deps, build TypeScript
   - **Stage 4 (production):**
     - Copy node_modules from dependencies stage
     - Copy build output (dist/) from build stage
     - Copy Prisma schema
     - Generate Prisma client
     - Set USER node
     - EXPOSE 3000
     - HEALTHCHECK using `/health/ready`
     - CMD ["node", "dist/main.js"]
2. Optimize layer caching (package.json before source code)

### Step 3: Create frontend Dockerfile (Static Option)

1. Create `apps/frontend/Dockerfile`:
   - **Stage 1 (build):** Build Astro static site
   - **Stage 2 (production):** FROM nginx:alpine
     - Copy static files to nginx html directory
     - Copy custom nginx.conf (if needed)
     - EXPOSE 80
     - CMD ["nginx", "-g", "daemon off;"]
2. Create `apps/frontend/nginx.conf` (optional):
   - Serve static files
   - Proxy API requests to backend (if needed)
   - Gzip compression

### Step 4: Create frontend Dockerfile (SSR Option)

Alternative for server-side rendering:

1. Similar multi-stage build
2. Final stage: FROM node:20-alpine
3. Copy node_modules and built server
4. EXPOSE 4321
5. CMD ["node", "./dist/server/entry.mjs"]

### Step 5: Test Docker builds locally

1. Build backend: `docker build -t gsd-backend:test ./apps/backend`
2. Build frontend: `docker build -t gsd-frontend:test ./apps/frontend`
3. Verify image sizes: `docker images | grep gsd`
4. Run containers locally:
   ```bash
   docker run -p 3000:3000 --env-file .env gsd-backend:test
   docker run -p 80:80 gsd-frontend:test
   ```
5. Test health endpoints and basic functionality

### Step 6: Create production Docker Compose file

1. Create `docker-compose.prod.yml`:
   - Backend service (from built image)
   - Frontend service (from built image)
   - PostgreSQL service (production config)
   - Networks (isolated backend network)
   - Volumes (persistent database storage)
   - Environment variables (from .env.production)
   - Health checks
   - Restart policies (always)
   - Resource limits
2. Test: `docker-compose -f docker-compose.prod.yml up`

### Step 7: Optimize Dockerfiles for caching

1. Ensure package.json copied before source code
2. Use --mount=type=cache for pnpm store (BuildKit)
3. Order layers from least to most frequently changed
4. Verify cache effectiveness: rebuild with single file change

### Step 8: Add health checks to Dockerfiles

1. Backend health check:
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
     CMD node -e "require('http').get('http://localhost:3000/health/ready', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"
   ```
2. Frontend health check (static Nginx):
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
     CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
   ```

### Step 9: Security hardening

1. Run as non-root user (USER directive)
2. Scan images for vulnerabilities:
   ```bash
   docker scan gsd-backend:test
   trivy image gsd-backend:test
   ```
3. Fix any high/critical vulnerabilities
4. Use specific base image versions (no `latest` tag)
5. Minimize installed packages

### Step 10: Create GitHub Actions workflow for Docker builds

1. Create `.github/workflows/docker-build.yml`:
   - Trigger: On push to main, on pull requests
   - Jobs:
     - Build backend image
     - Build frontend image
     - Run security scans (Trivy)
     - Push to GitHub Container Registry (ghcr.io)
   - Use Docker layer caching in CI
   - Tag images with git SHA and version
2. Configure GitHub Container Registry:
   - Create GHCR_TOKEN secret
   - Login to ghcr.io in workflow
   - Push images to ghcr.io/martenn/gsd-backend:latest

### Step 11: Test production images

1. Pull images from registry
2. Run with production-like environment:
   - Production DATABASE_URL
   - Production secrets
   - Production domains
3. Verify:
   - Application starts successfully
   - Health checks pass
   - API endpoints respond
   - Frontend loads correctly
   - Backend connects to database
4. Load testing (optional):
   - Use `ab` or `wrk` to send requests
   - Verify performance under load

### Step 12: Write deployment documentation

1. Create `docs/deployment.md`:
   - How to build images
   - How to run containers locally
   - Environment variables reference
   - Docker Compose usage
   - Kubernetes deployment examples (future)
   - Troubleshooting guide
2. Update README with Docker instructions
3. Document container registry locations

### Step 13: Update project tracker

1. Mark "Docker production images" as ✅
2. Update infrastructure progress percentage
3. Add notes about registry location and build workflow

## 10. Dockerfile Examples

### Backend Dockerfile (Multi-Stage)

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: Base
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Stage 2: Dependencies (production only)
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile --prod --filter @gsd/backend...

# Stage 3: Build
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend ./apps/backend
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @gsd/backend...
RUN pnpm --filter @gsd/backend build

# Stage 4: Production
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy built application
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./apps/backend/prisma
RUN cd apps/backend && pnpm prisma generate

# Security: Use non-root user
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/ready', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "apps/backend/dist/main.js"]
```

### Frontend Dockerfile (Static + Nginx)

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN pnpm install --frozen-lockfile --filter @gsd/frontend...
RUN pnpm --filter @gsd/frontend build

# Stage 2: Production (Nginx)
FROM nginx:alpine AS production

# Copy static files
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
# COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Security: Run as non-root (nginx already runs as nginx user)

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Production Docker Compose

```yaml
version: '3.9'

services:
  backend:
    image: ghcr.io/martenn/gsd-backend:latest
    container_name: gsd-backend
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://gsd:${DB_PASSWORD}@db:5432/gsd
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - backend-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'node', '-e', "require('http').get('http://localhost:3000/health/ready')"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  frontend:
    image: ghcr.io/martenn/gsd-frontend:latest
    container_name: gsd-frontend
    ports:
      - '80:80'
    environment:
      PUBLIC_API_URL: ${API_URL}
    depends_on:
      - backend
    networks:
      - backend-network
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    container_name: gsd-db
    environment:
      POSTGRES_USER: gsd
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: gsd
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - backend-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U gsd']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:

networks:
  backend-network:
    driver: bridge
```

## 11. CI/CD Workflow Example

```yaml
# .github/workflows/docker-build.yml
name: Build and Push Docker Images

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE: ghcr.io/${{ github.repository }}/backend
  FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/frontend

jobs:
  build-backend:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.BACKEND_IMAGE }}
          tags: |
            type=sha,prefix={{branch}}-
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/backend/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.BACKEND_IMAGE }}:latest
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build-frontend:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.FRONTEND_IMAGE }}
          tags: |
            type=sha,prefix={{branch}}-
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/frontend/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## Notes

- Docker production images are critical for deployment readiness
- Multi-stage builds significantly reduce image size (50-70% smaller)
- Security scanning should be part of CI/CD pipeline
- Use environment variables for all configuration (12-factor app principle)
- Test images locally before pushing to registry
- Consider using Docker layer caching in CI for faster builds
- Monitor image sizes and build times to ensure efficiency
- Plan for database migrations in production deployments (future)
