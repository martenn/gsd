# Docker Guide

End-to-end reference for building, testing, tagging, and publishing the GSD production Docker images, plus deployment and troubleshooting.

## Overview

The GSD project ships two production images:

- `gsd-backend` — NestJS API (Alpine-based, target size <200MB)
- `gsd-frontend` — Vite/React static build served by Nginx (Alpine-based, target size <100MB)

Both are built with multi-stage Dockerfiles from the monorepo root and pushed to a container registry (Docker Hub or GitHub Container Registry).

### File Reference

- Backend Dockerfile: `apps/backend/Dockerfile`
- Frontend Dockerfile: `apps/frontend/Dockerfile`
- Nginx Config: `apps/frontend/nginx.conf`
- Development docker-compose: `tools/docker/docker-compose.yml`

### Prerequisites

- Docker installed (Docker Engine 20.10+ or Docker Desktop)
- Docker BuildKit enabled (set `DOCKER_BUILDKIT=1`)
- At least 4GB of available disk space

---

## Local Docker Build (Dev)

### Backend Image

```bash
# Build from project root
docker build -t gsd-backend:test -f apps/backend/Dockerfile .

# Expected output: Successfully tagged gsd-backend:test
# Target size: <200MB
```

### Frontend Image

```bash
# Build from project root
docker build -t gsd-frontend:test -f apps/frontend/Dockerfile .

# Expected output: Successfully tagged gsd-frontend:test
# Target size: <100MB
```

### Verify Image Sizes

```bash
docker images | grep gsd

# Expected output:
# gsd-backend    test    <image-id>   X minutes ago   ~150-200MB
# gsd-frontend   test    <image-id>   X minutes ago   ~80-100MB
```

### Testing Backend Container

#### Create Test Environment File

Create `.env.test` in project root:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://gsd:gsd_dev_password@host.docker.internal:5432/gsd_dev
JWT_SECRET=test_secret_change_in_production
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:80
```

#### Run Backend Container

```bash
# Start PostgreSQL first (if not already running)
docker-compose -f tools/docker/docker-compose.yml up -d postgres

# Run backend container
docker run -p 3000:3000 --env-file .env.test --name gsd-backend-test gsd-backend:test

# In another terminal, test health endpoint
curl http://localhost:3000/health/ready

# Expected: {"status":"ok","info":{...}}
```

#### Test Backend API

```bash
# Check Swagger docs
open http://localhost:3000/api

# Test basic endpoints
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

#### Clean Up Backend

```bash
docker stop gsd-backend-test
docker rm gsd-backend-test
```

### Testing Frontend Container

#### Run Frontend Container

```bash
docker run -p 8080:80 --name gsd-frontend-test gsd-frontend:test

# Open browser
open http://localhost:8080
```

#### Verify Frontend Features

1. Page loads correctly
2. Static assets load (check Network tab)
3. Client-side routing works (navigate between pages)
4. Gzip compression enabled (check Response Headers: `Content-Encoding: gzip`)
5. Security headers present (check Response Headers)

#### Check Nginx Logs

```bash
# Access logs
docker logs gsd-frontend-test

# Exec into container
docker exec -it gsd-frontend-test sh
cat /var/log/nginx/access.log
cat /var/log/nginx/error.log
```

#### Clean Up Frontend

```bash
docker stop gsd-frontend-test
docker rm gsd-frontend-test
```

### Full Stack Testing (Optional)

Create a test docker-compose file to run all services together:

```bash
# Create docker-compose.test.yml
cat > docker-compose.test.yml <<'EOF'
version: '3.9'

services:
  backend:
    image: gsd-backend:test
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://gsd:gsd_dev_password@db:5432/gsd_dev
      JWT_SECRET: test_secret
      JWT_EXPIRES_IN: 7d
      FRONTEND_URL: http://localhost:8080
    depends_on:
      db:
        condition: service_healthy
    networks:
      - test-network

  frontend:
    image: gsd-frontend:test
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - test-network

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: gsd
      POSTGRES_PASSWORD: gsd_dev_password
      POSTGRES_DB: gsd_dev
    volumes:
      - test-postgres-data:/var/lib/postgresql/data
    networks:
      - test-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gsd"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  test-postgres-data:

networks:
  test-network:
    driver: bridge
EOF

# Run all services
docker-compose -f docker-compose.test.yml up

# Clean up
docker-compose -f docker-compose.test.yml down -v
```

---

## Production Multi-Stage Builds

### Build Optimization Tips

#### Use BuildKit Cache

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache mount (faster rebuilds)
docker build --progress=plain -t gsd-backend:test -f apps/backend/Dockerfile .
```

#### Check Build Layers

```bash
# Analyze image layers
docker history gsd-backend:test
docker history gsd-frontend:test

# See what takes up space
docker image inspect gsd-backend:test
```

#### Prune Build Cache

```bash
# Remove unused build cache
docker builder prune

# Remove all build cache
docker builder prune -a
```

### Security Scanning

```bash
# Using Docker Scout (if available)
docker scout cves gsd-backend:test
docker scout cves gsd-frontend:test

# Using Trivy (install separately)
trivy image gsd-backend:test
trivy image gsd-frontend:test
```

### Performance Testing

#### Backend Load Test

```bash
# Install Apache Bench
# Ubuntu/Debian: apt-get install apache2-utils
# macOS: brew install ab

# Simple load test
ab -n 1000 -c 10 http://localhost:3000/health/ready

# Expected: All requests successful, reasonable response times
```

#### Frontend Load Test

```bash
ab -n 1000 -c 10 http://localhost:8080/

# Check response times and successful requests
```

---

## Image Tagging / Versioning

Tags follow the convention `USERNAME/IMAGE:TAG` for registry publishing. Common tags:

- `latest` — most recent successful build on `main`
- `test` — local/CI test images
- semantic versions (e.g. `1.2.3`) — release builds
- short SHA — commit-pinned builds

```bash
# Tag a local image for the registry
docker tag gsd-backend:test YOUR_USERNAME/gsd-backend:latest
docker tag gsd-backend:test YOUR_USERNAME/gsd-backend:1.2.3
```

The GitHub Actions workflow accepts an `Additional tag` input (e.g. `test`) at workflow dispatch time.

---

## Docker Hub Setup (Auth, Repo Creation)

### 1. Create Docker Hub Account

#### Option A: Personal Account (Recommended for MVP)

1. **Go to Docker Hub** — Visit: https://hub.docker.com/signup
2. **Sign Up** — Enter email, choose a Docker ID (username), create a strong password, click "Sign Up"
3. **Verify Email** — Click the verification link
4. **Complete Profile** (Optional) — Add picture/bio, click "Save"

**Free Tier Limits:**

- 1 private repository
- Unlimited public repositories
- 200 container pulls per 6 hours (anonymous users share 100 pulls)

#### Option B: Organization Account (For Teams)

1. **Create Personal Account First** (follow steps above)
2. **Create Organization**
   - Click your username (top right) → "Organizations"
   - Click "Create Organization"
   - Enter organization name (e.g., "gsd-app")
   - Choose plan (Free or paid)
   - Click "Create Organization"
3. **Invite Team Members** (Optional)
   - Go to "Members" tab → "Invite Members"
   - Enter email addresses, assign roles (Owner, Member, Read-Only)

### 2. Create Access Token

**Why Access Tokens?**

- More secure than passwords
- Can be scoped to specific permissions
- Can be revoked without changing password
- Required for CI/CD automation

#### Steps

1. **Login to Docker Hub** — https://hub.docker.com/
2. **Navigate to Security Settings**
   - Click your username (top right) → "Account Settings" → "Security"
3. **Create New Access Token**
   - Click "New Access Token"
   - **Token Description**: e.g. `github-actions-gsd-ci`
   - **Access Permissions**: **Read, Write, Delete** (recommended for CI/CD), or Read-only
   - Click "Generate"
4. **Copy and Save Token**
   - **IMPORTANT**: Copy immediately — shown only once
   - Store in password manager
5. **Click "Copy and Close"**

**Example Token:**

```
dckr_pat_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### 3. Configure GitHub Secrets

GitHub Secrets store sensitive credentials securely and make them available to GitHub Actions workflows.

1. **Go to Your GitHub Repository** — e.g. `https://github.com/martenn/gsd`
2. **Navigate to Settings** — "Settings" tab (admin access required)
3. **Go to Secrets and Variables** — Expand "Secrets and variables" in sidebar → "Actions"
4. **Add `DOCKERHUB_USERNAME` Secret**
   - Click "New repository secret"
   - **Name**: `DOCKERHUB_USERNAME`
   - **Value**: Your Docker Hub username (e.g., `martenn`)
   - Click "Add secret"
5. **Add `DOCKERHUB_TOKEN` Secret**
   - **Name**: `DOCKERHUB_TOKEN`
   - **Value**: Paste the access token (e.g., `dckr_pat_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`)
   - Click "Add secret"
6. **Verify Secrets** — Both should be listed (values not viewable after creation)

#### Security Best Practices

- Use repository secrets for single-repo access
- Use organization secrets for multi-repo access
- Rotate tokens regularly (every 90 days recommended)
- Use minimal permissions (read-only if possible)
- Never commit secrets to git or expose in logs
- Delete unused tokens from Docker Hub

### GitHub Secrets Reference

| Secret Name          | Description              | Example              |
| -------------------- | ------------------------ | -------------------- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `martenn`            |
| `DOCKERHUB_TOKEN`    | Docker Hub access token  | `dckr_pat_abc123...` |

### Docker Hub URLs

| Resource         | URL                                               |
| ---------------- | ------------------------------------------------- |
| Sign Up          | https://hub.docker.com/signup                     |
| Login            | https://hub.docker.com/                           |
| Repositories     | https://hub.docker.com/repositories/YOUR_USERNAME |
| Access Tokens    | https://hub.docker.com/settings/security          |
| Account Settings | https://hub.docker.com/settings/general           |

---

## Publishing / Push Workflow

### Test Authentication Locally

Before using GitHub Actions, test your credentials work:

```bash
# Login to Docker Hub using access token
echo "YOUR_ACCESS_TOKEN" | docker login -u YOUR_USERNAME --password-stdin

# Expected output:
# Login Succeeded
```

**Example:**

```bash
echo "dckr_pat_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p" | docker login -u martenn --password-stdin
```

### Test Building and Pushing Image

```bash
# Build a test image
docker build -t YOUR_USERNAME/gsd-backend:test -f apps/backend/Dockerfile .

# Push to Docker Hub
docker push YOUR_USERNAME/gsd-backend:test

# Expected output:
# The push refers to repository [docker.io/YOUR_USERNAME/gsd-backend]
# test: digest: sha256:abc123... size: 1234
```

### Test with GitHub Actions Workflow

1. **Go to GitHub Actions** — Repository → "Actions" tab
2. **Run Docker Build Workflow**
   - Select "Build Docker Images" workflow
   - Click "Run workflow"
   - Configure:
     - **Branch**: `main` or your current branch
     - **Push images to registry**: `true`
     - **Container registry**: `docker.io`
     - **Additional tag**: `test` (optional)
   - Click "Run workflow"
3. **Monitor Workflow Execution**
   - Watch build logs in real-time
   - Check for successful authentication:
     ```
     Login to Docker Hub
     Login Succeeded
     ```
   - Verify images are pushed:
     ```
     Pushing to docker.io/YOUR_USERNAME/gsd-backend:latest
     ```
4. **Verify on Docker Hub**
   - https://hub.docker.com/repositories/YOUR_USERNAME
   - You should see `gsd-backend` and `gsd-frontend` repositories

### Workflow Dispatch Options

| Input         | Type    | Default   | Description      |
| ------------- | ------- | --------- | ---------------- |
| `push_images` | boolean | `false`   | Push to registry |
| `registry`    | choice  | `ghcr.io` | Registry to use  |
| `tag`         | string  | -         | Custom tag       |

### Docker CLI Quick Reference

```bash
# Login
echo "TOKEN" | docker login -u USERNAME --password-stdin

# Build image
docker build -t USERNAME/IMAGE:TAG -f Dockerfile .

# Push image
docker push USERNAME/IMAGE:TAG

# Pull image
docker pull USERNAME/IMAGE:TAG

# List local images
docker images

# Remove local image
docker rmi USERNAME/IMAGE:TAG

# Logout
docker logout
```

### Alternative: GitHub Container Registry (ghcr.io)

If you prefer not to use Docker Hub, you can use GitHub Container Registry instead.

**Advantages:**

- No separate signup required (uses GitHub account)
- No pull rate limits
- Unlimited private repositories
- Integrated with GitHub (same authentication)
- No extra configuration needed (uses `GITHUB_TOKEN`)

**Quick Setup:**

1. No setup required — workflow uses `GITHUB_TOKEN` automatically
2. Run workflow with `registry=ghcr.io`
3. Images pushed to: `ghcr.io/martenn/gsd/backend:latest`

**View Images:**

- https://github.com/martenn/gsd/pkgs/container/gsd%2Fbackend
- Or: Your repository → Packages (right sidebar)

### Managing Images on Docker Hub

#### View Your Repositories

1. https://hub.docker.com/repositories/YOUR_USERNAME
2. Repository info shows: Tags, Description, Pulls, Last Pushed, Stars

#### Configure Repository Settings

1. Click on a repository (e.g., `gsd-backend`)
2. **General Settings**
   - **Description**: Add overview of the image
   - **Full Description**: Add detailed documentation (supports Markdown)
   - **Visibility**: Public or Private
   - **README**: Link to GitHub README (auto-sync available)
3. **Add README** (Recommended) — Create a `README.md` in your repository root:

   ````markdown
   # GSD Backend Docker Image

   Production-ready Docker image for GSD (Getting Shit Done) backend API.

   ## Quick Start

   ```bash
   docker pull martenn/gsd-backend:latest
   docker run -p 3000:3000 --env-file .env martenn/gsd-backend:latest
   ```
   ````

#### Delete Images/Tags

1. Go to Repository → Tags tab
2. Select tags (checkbox)
3. Click "Delete" → confirm

**Warning**: Deletion is permanent.

#### Make Repository Private

1. Repository → Settings tab
2. Visibility: change "Public" to "Private" → Save

**Note**: Free accounts limited to 1 private repository.

---

## Pull / Deploy on Target Host

```bash
# Pull image from Docker Hub
docker pull YOUR_USERNAME/gsd-backend:latest
docker pull YOUR_USERNAME/gsd-frontend:latest

# Run backend with env file
docker run -p 3000:3000 --env-file .env YOUR_USERNAME/gsd-backend:latest

# Run frontend
docker run -p 80:80 YOUR_USERNAME/gsd-frontend:latest
```

For full-stack production deployments use `docker-compose` (see `docker-compose.yml` at repo root) or your orchestrator of choice (Kubernetes, ECS, etc.).

### Next Steps After Local Testing

1. Push images to container registry (Docker Hub, GitHub Container Registry, etc.)
2. Deploy to production environment (Kubernetes, ECS, etc.)
3. Set up CI/CD pipeline for automated builds
4. Configure production environment variables
5. Set up database migrations in deployment pipeline

### Next Steps After Docker Hub Setup

1. Test workflow with `push_images=false` (build only)
2. Review security scan results
3. Test workflow with `push_images=true`
4. Verify images appear on Docker Hub
5. Pull and test images locally
6. Document registry URLs for deployment
7. Set up automated builds (optional)
8. Configure webhooks for notifications (optional)

---

## Troubleshooting

### Debugging Local Containers

#### Interactive Shell Access

```bash
# Backend (Alpine Linux)
docker run -it --entrypoint sh gsd-backend:test

# Frontend (Nginx Alpine)
docker run -it --entrypoint sh gsd-frontend:test
```

#### Check Environment Variables

```bash
docker exec gsd-backend-test env
docker exec gsd-frontend-test env
```

#### Inspect File Permissions

```bash
docker exec gsd-backend-test ls -la /app
docker exec gsd-frontend-test ls -la /usr/share/nginx/html
```

#### View Container Logs

```bash
docker logs gsd-backend-test
docker logs gsd-frontend-test
docker logs -f gsd-backend-test  # Follow logs
```

### Local Build & Runtime Issues

#### Issue: "Port already in use"

**Solution:** Stop conflicting container or change port mapping

```bash
docker ps
docker stop <conflicting-container>
# Or use different port: -p 3001:3000
```

#### Issue: "Permission denied" errors

**Cause:** Non-root user cannot access files
**Solution:** Check file permissions in Dockerfile, ensure proper ownership

#### Issue: Health check fails

**Cause:** App not ready or database unreachable
**Solution:**

- Check database is running and accessible
- Verify DATABASE_URL is correct
- Check container logs for startup errors

#### Issue: "Cannot connect to database"

**Cause:** Database URL points to localhost (not accessible from container)
**Solution:** Use `host.docker.internal` (macOS/Windows) or host IP (Linux)

#### Issue: Build fails with "No space left on device"

**Solution:**

```bash
docker system prune -a
docker builder prune -a
```

### Registry / Publishing Issues

#### Issue: "unauthorized: incorrect username or password"

**Cause**: Invalid credentials or using password instead of access token

**Solution:**

1. Verify you're using an access token, not password
2. Check token hasn't been revoked on Docker Hub
3. Verify GitHub secret values are correct (no extra spaces/newlines)
4. Regenerate access token if needed

**Test locally:**

```bash
echo "YOUR_TOKEN" | docker login -u YOUR_USERNAME --password-stdin
```

#### Issue: "denied: requested access to the resource is denied"

**Cause**: Insufficient permissions or repository doesn't exist

**Solution:**

1. Verify repository name matches your Docker Hub username
   - Correct: `docker.io/martenn/gsd-backend`
   - Wrong: `docker.io/gsd/backend` (unless org is named "gsd")
2. Ensure access token has "Read, Write, Delete" permissions
3. Create repository on Docker Hub first (or enable auto-create)

#### Issue: "toomanyrequests: You have reached your pull rate limit"

**Cause**: Exceeded 200 pulls per 6 hours (free tier limit)

**Solution:**

1. Wait for rate limit to reset (6 hours)
2. Login to Docker Hub (authenticated users get higher limits)
3. Upgrade to paid plan for unlimited pulls
4. Use GitHub Container Registry (ghcr.io) instead

#### Issue: GitHub Actions fails with "Error: Process completed with exit code 1"

**Cause**: Various reasons (authentication, build errors, network)

**Solution:**

1. Check workflow logs for specific error message
2. Verify GitHub secrets are set correctly
3. Test build locally first:
   ```bash
   docker build -t test-image -f apps/backend/Dockerfile .
   ```
4. Check Dockerfile syntax
5. Verify base image availability (e.g., `node:20-alpine`)

#### Issue: Images are too large

**Cause**: Including unnecessary files or dependencies

**Solution:**

1. Review `.dockerignore` file
2. Ensure multi-stage builds are working
3. Check layer sizes:
   ```bash
   docker history YOUR_USERNAME/gsd-backend:latest
   ```
4. Remove build dependencies in production stage
5. Use Alpine base images

#### Issue: Security scan fails with vulnerabilities

**Cause**: Base image or dependencies have known CVEs

**Solution:**

1. Update base image version:
   ```dockerfile
   FROM node:20-alpine  # Use latest patch version
   ```
2. Update npm dependencies:
   ```bash
   pnpm update
   ```
3. Review Trivy scan results in GitHub Security tab
4. Fix critical/high vulnerabilities first
5. Consider alternative base images if needed

---

## Additional Resources

- [Docker Hub Official Docs](https://docs.docker.com/docker-hub/)
- [Access Tokens Documentation](https://docs.docker.com/security/for-developers/access-tokens/)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
