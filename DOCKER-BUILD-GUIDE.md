# Docker Build & Testing Guide

This guide provides instructions for building and testing the GSD production Docker images locally.

## Prerequisites

- Docker installed (Docker Engine 20.10+ or Docker Desktop)
- Docker BuildKit enabled (set `DOCKER_BUILDKIT=1`)
- At least 4GB of available disk space

## Building Images

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

## Verify Image Sizes

```bash
docker images | grep gsd

# Expected output:
# gsd-backend    test    <image-id>   X minutes ago   ~150-200MB
# gsd-frontend   test    <image-id>   X minutes ago   ~80-100MB
```

## Testing Backend Container

### Create Test Environment File

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

### Run Backend Container

```bash
# Start PostgreSQL first (if not already running)
docker-compose -f tools/docker/docker-compose.yml up -d postgres

# Run backend container
docker run -p 3000:3000 --env-file .env.test --name gsd-backend-test gsd-backend:test

# In another terminal, test health endpoint
curl http://localhost:3000/health/ready

# Expected: {"status":"ok","info":{...}}
```

### Test Backend API

```bash
# Check Swagger docs
open http://localhost:3000/api

# Test basic endpoints
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

### Clean Up Backend

```bash
docker stop gsd-backend-test
docker rm gsd-backend-test
```

## Testing Frontend Container

### Run Frontend Container

```bash
docker run -p 8080:80 --name gsd-frontend-test gsd-frontend:test

# Open browser
open http://localhost:8080
```

### Verify Frontend Features

1. Page loads correctly
2. Static assets load (check Network tab)
3. Client-side routing works (navigate between pages)
4. Gzip compression enabled (check Response Headers: `Content-Encoding: gzip`)
5. Security headers present (check Response Headers)

### Check Nginx Logs

```bash
# Access logs
docker logs gsd-frontend-test

# Exec into container
docker exec -it gsd-frontend-test sh
cat /var/log/nginx/access.log
cat /var/log/nginx/error.log
```

### Clean Up Frontend

```bash
docker stop gsd-frontend-test
docker rm gsd-frontend-test
```

## Full Stack Testing (Optional)

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

## Debugging

### Interactive Shell Access

```bash
# Backend (Alpine Linux)
docker run -it --entrypoint sh gsd-backend:test

# Frontend (Nginx Alpine)
docker run -it --entrypoint sh gsd-frontend:test
```

### Check Environment Variables

```bash
docker exec gsd-backend-test env
docker exec gsd-frontend-test env
```

### Inspect File Permissions

```bash
docker exec gsd-backend-test ls -la /app
docker exec gsd-frontend-test ls -la /usr/share/nginx/html
```

### View Container Logs

```bash
docker logs gsd-backend-test
docker logs gsd-frontend-test
docker logs -f gsd-backend-test  # Follow logs
```

## Build Optimization Tips

### Use BuildKit Cache

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache mount (faster rebuilds)
docker build --progress=plain -t gsd-backend:test -f apps/backend/Dockerfile .
```

### Check Build Layers

```bash
# Analyze image layers
docker history gsd-backend:test
docker history gsd-frontend:test

# See what takes up space
docker image inspect gsd-backend:test
```

### Prune Build Cache

```bash
# Remove unused build cache
docker builder prune

# Remove all build cache
docker builder prune -a
```

## Security Scanning

### Scan for Vulnerabilities

```bash
# Using Docker Scout (if available)
docker scout cves gsd-backend:test
docker scout cves gsd-frontend:test

# Using Trivy (install separately)
trivy image gsd-backend:test
trivy image gsd-frontend:test
```

## Performance Testing

### Backend Load Test

```bash
# Install Apache Bench
# Ubuntu/Debian: apt-get install apache2-utils
# macOS: brew install ab

# Simple load test
ab -n 1000 -c 10 http://localhost:3000/health/ready

# Expected: All requests successful, reasonable response times
```

### Frontend Load Test

```bash
ab -n 1000 -c 10 http://localhost:8080/

# Check response times and successful requests
```

## Common Issues

### Issue: "Port already in use"
**Solution:** Stop conflicting container or change port mapping
```bash
docker ps
docker stop <conflicting-container>
# Or use different port: -p 3001:3000
```

### Issue: "Permission denied" errors
**Cause:** Non-root user cannot access files
**Solution:** Check file permissions in Dockerfile, ensure proper ownership

### Issue: Health check fails
**Cause:** App not ready or database unreachable
**Solution:**
- Check database is running and accessible
- Verify DATABASE_URL is correct
- Check container logs for startup errors

### Issue: "Cannot connect to database"
**Cause:** Database URL points to localhost (not accessible from container)
**Solution:** Use `host.docker.internal` (macOS/Windows) or host IP (Linux)

### Issue: Build fails with "No space left on device"
**Solution:**
```bash
docker system prune -a
docker builder prune -a
```

## Next Steps

After successful local testing:
1. Push images to container registry (GitHub Container Registry, Docker Hub, etc.)
2. Deploy to production environment (Kubernetes, ECS, etc.)
3. Set up CI/CD pipeline for automated builds
4. Configure production environment variables
5. Set up database migrations in deployment pipeline

## Reference

- Backend Dockerfile: `apps/backend/Dockerfile`
- Frontend Dockerfile: `apps/frontend/Dockerfile`
- Nginx Config: `apps/frontend/nginx.conf`
- Development docker-compose: `tools/docker/docker-compose.yml`
