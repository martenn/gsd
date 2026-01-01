# GSD Deployment Plan - Single Server Docker Setup

**Created:** 2025-12-31
**Status:** Planning Phase
**Target Environment:** Single Linux server with Docker, DNS + IPv6

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Docker Services](#docker-services)
5. [Deployment Steps](#deployment-steps)
6. [Environment Configuration](#environment-configuration)
7. [Database Management](#database-management)
8. [SSL/TLS Certificates](#ssltls-certificates)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup Strategy](#backup-strategy)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Security Hardening](#security-hardening)
13. [Maintenance & Updates](#maintenance--updates)
14. [Troubleshooting](#troubleshooting)

---

## Overview

### Deployment Architecture

**Single-server Docker stack** running:
- **Frontend**: Astro static site (Nginx container)
- **Backend**: NestJS API (Node.js container)
- **Database**: PostgreSQL (PostgreSQL container)
- **Reverse Proxy**: Nginx proxy for SSL termination and routing
- **Certificate Management**: Certbot for Let's Encrypt SSL

### Domain Structure

```
gsd.yourdomain.com
├── /           → Frontend (Nginx serving static files)
├── /api/*      → Backend (NestJS API)
└── /health     → Health checks
```

### Network Configuration

- **IPv4 + IPv6**: Dual-stack configuration
- **SSL/TLS**: HTTPS-only with automatic redirect
- **DNS**: A and AAAA records for dual-stack access

---

## Architecture

### Service Communication

```
Internet (IPv4/IPv6)
    ↓
DNS (A + AAAA records)
    ↓
Nginx Reverse Proxy (Port 80/443)
    ├── HTTPS → Frontend (Nginx static files)
    └── HTTPS /api/* → Backend (NestJS API)
            ↓
        PostgreSQL (Docker network)
```

### Docker Network

All services communicate on a dedicated Docker bridge network:
- **Frontend**: Exposed via reverse proxy
- **Backend**: Exposed via reverse proxy
- **PostgreSQL**: Internal only (not exposed to internet)

---

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- **OS**: Ubuntu 22.04 LTS or Debian 12
- **CPU**: 2 vCPU
- **RAM**: 4GB (2GB minimum)
- **Storage**: 20GB SSD
- **Network**: IPv4 + IPv6 connectivity

**Recommended Specifications:**
- **CPU**: 4 vCPU
- **RAM**: 8GB
- **Storage**: 40GB SSD

### DNS Configuration

Before deployment, configure DNS records:

```
A     gsd.yourdomain.com    → <server-ipv4>
AAAA  gsd.yourdomain.com    → <server-ipv6>
```

**Verification:**
```bash
# Check A record
dig gsd.yourdomain.com A

# Check AAAA record
dig gsd.yourdomain.com AAAA
```

### SSH Access

Ensure SSH access is configured:
```bash
ssh user@your-server-ip
```

---

## Docker Services

### 1. PostgreSQL Database

**Container Name:** `gsd-postgres`

```yaml
# docker-compose.yml (excerpt)
postgres:
  image: postgres:16-alpine
  container_name: gsd-postgres
  restart: unless-stopped
  environment:
    POSTGRES_DB: gsd
    POSTGRES_USER: gsd_user
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backups:/backups
  networks:
    - gsd-network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U gsd_user -d gsd"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Features:**
- Alpine-based for smaller image size
- Persistent volume for data
- Health checks for readiness probing
- Backup mount point

### 2. Backend (NestJS API)

**Container Name:** `gsd-backend`

```yaml
backend:
  build:
    context: ./apps/backend
    dockerfile: Dockerfile
    target: production
  container_name: gsd-backend
  restart: unless-stopped
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://gsd_user:${DB_PASSWORD}@postgres:5432/gsd
    JWT_SECRET: ${JWT_SECRET}
    JWT_EXPIRES_IN: 7d
    GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
    GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    GOOGLE_CALLBACK_URL: https://gsd.yourdomain.com/api/auth/google/callback
    FRONTEND_URL: https://gsd.yourdomain.com
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - gsd-network
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Features:**
- Multi-stage Docker build (production target)
- Waits for PostgreSQL to be healthy
- Health checks on /health endpoint
- Environment-based configuration

### 3. Frontend (Astro + Nginx)

**Container Name:** `gsd-frontend`

```yaml
frontend:
  build:
    context: ./apps/frontend
    dockerfile: Dockerfile
  container_name: gsd-frontend
  restart: unless-stopped
  environment:
    PUBLIC_API_URL: https://gsd.yourdomain.com/api
  networks:
    - gsd-network
```

**Features:**
- Nginx Alpine serving static files
- Minimal footprint (~20MB)
- Production-optimized build

### 4. Nginx Reverse Proxy

**Container Name:** `gsd-nginx-proxy`

```yaml
nginx-proxy:
  image: nginx:alpine
  container_name: gsd-nginx-proxy
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
    - "[::]:80:80"      # IPv6
    - "[::]:443:443"    # IPv6
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/conf.d:/etc/nginx/conf.d:ro
    - ./certbot/conf:/etc/letsencrypt:ro
    - ./certbot/www:/var/www/certbot:ro
  depends_on:
    - backend
    - frontend
  networks:
    - gsd-network
```

### 5. Certbot (SSL Certificates)

**Container Name:** `gsd-certbot`

```yaml
certbot:
  image: certbot/certbot
  container_name: gsd-certbot
  volumes:
    - ./certbot/conf:/etc/letsencrypt
    - ./certbot/www:/var/www/certbot
  entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

---

## Deployment Steps

### Step 1: Initial Server Setup

```bash
# SSH into server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Enable IPv6 in Docker daemon
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "ipv6": true,
  "fixed-cidr-v6": "fd00::/80",
  "experimental": true,
  "ip6tables": true
}
EOF

sudo systemctl restart docker

# Install additional tools
sudo apt install -y git curl wget htop vim
```

### Step 2: Clone Repository

```bash
# Create deployment directory
mkdir -p /opt/gsd
cd /opt/gsd

# Clone repository (or copy files via scp)
git clone https://github.com/yourusername/gsd.git .

# Or use SCP to copy files
# scp -r ./gsd user@server:/opt/gsd
```

### Step 3: Create Environment Files

```bash
# Create .env file in /opt/gsd
cat > .env <<EOF
# Database
DB_PASSWORD=your_secure_db_password_here

# JWT
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Domain
DOMAIN=gsd.yourdomain.com

# Email for Let's Encrypt
LETSENCRYPT_EMAIL=your-email@example.com
EOF

# Secure the file
chmod 600 .env
```

### Step 4: Create Docker Compose File

```bash
cat > /opt/gsd/docker-compose.yml <<'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: gsd-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: gsd
      POSTGRES_USER: gsd_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - gsd-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gsd_user -d gsd"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
      target: production
    container_name: gsd-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://gsd_user:${DB_PASSWORD}@postgres:5432/gsd
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_CALLBACK_URL: https://${DOMAIN}/api/auth/google/callback
      FRONTEND_URL: https://${DOMAIN}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - gsd-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: gsd-frontend
    restart: unless-stopped
    environment:
      PUBLIC_API_URL: https://${DOMAIN}/api
    networks:
      - gsd-network

  nginx-proxy:
    image: nginx:alpine
    container_name: gsd-nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "[::]:80:80"
      - "[::]:443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    networks:
      - gsd-network
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  certbot:
    image: certbot/certbot
    container_name: gsd-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  gsd-network:
    driver: bridge
    enable_ipv6: true
    ipam:
      config:
        - subnet: 172.25.0.0/16
        - subnet: fd00::/80

volumes:
  postgres_data:
    driver: local
EOF
```

### Step 5: Create Nginx Configuration

```bash
# Create nginx directory structure
mkdir -p /opt/gsd/nginx/conf.d

# Create main nginx.conf
cat > /opt/gsd/nginx/nginx.conf <<'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Include site configs
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create site configuration
cat > /opt/gsd/nginx/conf.d/gsd.conf <<'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# Upstream backends
upstream backend {
    server backend:3000;
    keepalive 32;
}

upstream frontend {
    server frontend:80;
    keepalive 32;
}

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name gsd.yourdomain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS - Main site
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name gsd.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/gsd.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gsd.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API routes - backend
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://backend/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Frontend - static files
    location / {
        limit_req zone=general_limit burst=50 nodelay;

        proxy_pass http://frontend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            proxy_cache_valid 200 1d;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
```

### Step 6: Obtain SSL Certificate (First Time)

```bash
# Create directories
mkdir -p /opt/gsd/certbot/conf
mkdir -p /opt/gsd/certbot/www

# Start nginx in HTTP-only mode first (temporary config)
cat > /opt/gsd/nginx/conf.d/gsd-temp.conf <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name gsd.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "OK";
    }
}
EOF

# Start only nginx proxy temporarily
docker compose up -d nginx-proxy

# Obtain certificate
docker compose run --rm certbot certonly --webroot \
    --webroot-path /var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d gsd.yourdomain.com

# Remove temporary config
rm /opt/gsd/nginx/conf.d/gsd-temp.conf

# Reload nginx with full SSL config
docker compose restart nginx-proxy
```

### Step 7: Build and Start All Services

```bash
cd /opt/gsd

# Build images
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 8: Run Database Migrations

```bash
# Execute migrations inside backend container
docker compose exec backend npm run db:migrate:deploy

# Verify database
docker compose exec postgres psql -U gsd_user -d gsd -c "\dt"
```

### Step 9: Verify Deployment

```bash
# Check health endpoints
curl https://gsd.yourdomain.com/health
curl https://gsd.yourdomain.com/api/health

# Check frontend
curl -I https://gsd.yourdomain.com/

# Check logs
docker compose logs backend
docker compose logs frontend
docker compose logs nginx-proxy

# Verify IPv6
curl -6 https://gsd.yourdomain.com/health
```

---

## Environment Configuration

### Backend Environment Variables

Required in `.env` or `docker-compose.yml`:

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://gsd_user:${DB_PASSWORD}@postgres:5432/gsd

# JWT Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_CALLBACK_URL=https://gsd.yourdomain.com/api/auth/google/callback

# Frontend URL
FRONTEND_URL=https://gsd.yourdomain.com
```

### Frontend Environment Variables

```bash
PUBLIC_API_URL=https://gsd.yourdomain.com/api
```

### Generate Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

---

## Database Management

### Initial Setup

Database is automatically created on first start via PostgreSQL image environment variables.

### Running Migrations

```bash
# Deploy migrations (production)
docker compose exec backend npm run db:migrate:deploy

# Check migration status
docker compose exec backend npx prisma migrate status

# Generate Prisma client (if needed)
docker compose exec backend npm run db:generate
```

### Database Access

```bash
# PostgreSQL shell
docker compose exec postgres psql -U gsd_user -d gsd

# Common commands
\dt          # List tables
\d+ lists    # Describe lists table
\q           # Quit
```

### Database Backups

**Manual Backup:**

```bash
# Create backup directory
mkdir -p /opt/gsd/backups

# Create backup
docker compose exec postgres pg_dump -U gsd_user gsd > /opt/gsd/backups/gsd-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip /opt/gsd/backups/gsd-*.sql
```

**Automated Backup Script:**

```bash
cat > /opt/gsd/scripts/backup-db.sh <<'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/opt/gsd/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gsd-$DATE.sql"
KEEP_DAYS=7

# Create backup
docker compose -f /opt/gsd/docker-compose.yml exec -T postgres \
    pg_dump -U gsd_user gsd > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Delete old backups (keep last 7 days)
find "$BACKUP_DIR" -name "gsd-*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x /opt/gsd/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/gsd/scripts/backup-db.sh >> /var/log/gsd-backup.log 2>&1") | crontab -
```

**Restore from Backup:**

```bash
# Stop backend
docker compose stop backend

# Restore database
gunzip -c /opt/gsd/backups/gsd-20250101-020000.sql.gz | \
    docker compose exec -T postgres psql -U gsd_user -d gsd

# Start backend
docker compose start backend
```

---

## SSL/TLS Certificates

### Certificate Renewal

Certbot container automatically renews certificates every 12 hours.

**Manual Renewal:**

```bash
# Force renewal
docker compose run --rm certbot renew

# Reload nginx
docker compose exec nginx-proxy nginx -s reload
```

### Certificate Monitoring

```bash
# Check certificate expiration
echo | openssl s_client -servername gsd.yourdomain.com \
    -connect gsd.yourdomain.com:443 2>/dev/null | \
    openssl x509 -noout -dates
```

### Troubleshooting SSL

If certificate renewal fails:

```bash
# Check certbot logs
docker compose logs certbot

# Verify DNS is correct
dig gsd.yourdomain.com A
dig gsd.yourdomain.com AAAA

# Test certificate manually
docker compose run --rm certbot certonly --webroot \
    --webroot-path /var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --dry-run \
    -d gsd.yourdomain.com
```

---

## Monitoring & Logging

### Log Management

**View Real-time Logs:**

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f nginx-proxy

# Last 100 lines
docker compose logs --tail=100 backend
```

**Log Rotation:**

Docker handles log rotation automatically. Configure in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Health Monitoring

**Health Check Script:**

```bash
cat > /opt/gsd/scripts/health-check.sh <<'EOF'
#!/bin/bash
set -e

DOMAIN="https://gsd.yourdomain.com"

# Check frontend
if ! curl -sf "$DOMAIN/" > /dev/null; then
    echo "ERROR: Frontend is down"
    exit 1
fi

# Check backend health
if ! curl -sf "$DOMAIN/api/health" > /dev/null; then
    echo "ERROR: Backend health check failed"
    exit 1
fi

# Check database
if ! docker compose -f /opt/gsd/docker-compose.yml exec -T postgres \
    pg_isready -U gsd_user -d gsd > /dev/null 2>&1; then
    echo "ERROR: Database is not ready"
    exit 1
fi

echo "All services healthy"
EOF

chmod +x /opt/gsd/scripts/health-check.sh
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes
```

### Optional: Prometheus + Grafana

For advanced monitoring, consider adding Prometheus and Grafana containers (documented separately).

---

## Backup Strategy

### What to Backup

1. **Database** (Critical)
   - Automated daily backups (see Database Management section)
   - Keep 7 days local, 30 days off-site

2. **Environment Files** (Critical)
   - `/opt/gsd/.env`
   - Back up manually to secure location

3. **SSL Certificates** (Important)
   - `/opt/gsd/certbot/conf`
   - Backed up automatically, but can be re-issued

4. **Configuration** (Important)
   - `docker-compose.yml`
   - `nginx/` directory
   - Version controlled in Git

### Off-site Backup

**Option 1: SCP to Remote Server**

```bash
cat > /opt/gsd/scripts/offsite-backup.sh <<'EOF'
#!/bin/bash
REMOTE_USER="backup"
REMOTE_HOST="backup.server.com"
REMOTE_DIR="/backups/gsd"
LOCAL_DIR="/opt/gsd/backups"

# Sync backups to remote server
rsync -avz --delete "$LOCAL_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
EOF

chmod +x /opt/gsd/scripts/offsite-backup.sh
```

**Option 2: AWS S3 / Backblaze B2**

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure rclone (interactive)
rclone config

# Upload to cloud storage
rclone sync /opt/gsd/backups remote:gsd-backups
```

---

## CI/CD Pipeline

### Automated Deployment with GitHub Actions

**Strategy:** Build Docker images on GitHub Actions, push to registry, pull and restart on server.

#### Step 1: GitHub Container Registry

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/backend
          file: ./apps/backend/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/frontend
          file: ./apps/frontend/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/gsd
            docker compose pull
            docker compose up -d --force-recreate
            docker compose exec -T backend npm run db:migrate:deploy
```

#### Step 2: Server Setup for Auto-deploy

```bash
# On server: Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Update docker-compose.yml to use registry images
# Replace 'build:' sections with 'image:' for backend and frontend
```

Updated `docker-compose.yml`:

```yaml
services:
  backend:
    image: ghcr.io/yourusername/gsd/backend:latest
    container_name: gsd-backend
    restart: unless-stopped
    # ... rest of config

  frontend:
    image: ghcr.io/yourusername/gsd/frontend:latest
    container_name: gsd-frontend
    restart: unless-stopped
    # ... rest of config
```

#### Step 3: GitHub Secrets

Add to your GitHub repository secrets:

- `SSH_HOST`: Your server IP or domain
- `SSH_USER`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key for authentication

#### Alternative: Watchtower (Auto-update on Image Change)

**Simpler option:** Use Watchtower to automatically pull and restart containers when images update.

Add to `docker-compose.yml`:

```yaml
watchtower:
  image: containrrr/watchtower
  container_name: gsd-watchtower
  restart: unless-stopped
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - WATCHTOWER_CLEANUP=true
    - WATCHTOWER_POLL_INTERVAL=300  # Check every 5 minutes
    - WATCHTOWER_INCLUDE_STOPPED=false
  command: gsd-backend gsd-frontend
```

**Note:** Watchtower will automatically pull new images and restart containers. Combine with GitHub Actions pushing to registry for full automation.

---

## Security Hardening

### Server-Level Security

**1. Firewall (UFW):**

```bash
# Install UFW
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if using non-standard)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow IPv6
sudo ufw allow 80/tcp comment 'HTTP IPv6'
sudo ufw allow 443/tcp comment 'HTTPS IPv6'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

**2. Fail2Ban (SSH Protection):**

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit jail.local
sudo vim /etc/fail2ban/jail.local
# Set:
# bantime = 1h
# maxretry = 3

# Restart
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

**3. SSH Hardening:**

Edit `/etc/ssh/sshd_config`:

```bash
# Disable root login
PermitRootLogin no

# Use SSH keys only
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

**4. Automatic Security Updates:**

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades

# Enable
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Docker Security

**1. Run Containers as Non-root:**

Already implemented in Dockerfiles:

```dockerfile
USER node  # Backend
USER nginx # Frontend/Nginx
```

**2. Limit Container Resources:**

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

**3. Docker Daemon Security:**

Edit `/etc/docker/daemon.json`:

```json
{
  "icc": false,
  "userland-proxy": false,
  "no-new-privileges": true
}
```

### Application Security

Already implemented:
- ✅ HTTPS-only with HSTS
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ HttpOnly cookies with SameSite=Strict
- ✅ Rate limiting (Nginx + backend)
- ✅ Input validation and sanitization

---

## Maintenance & Updates

### Regular Maintenance Tasks

**Weekly:**
- Review logs for errors
- Check disk usage
- Verify backups are running

**Monthly:**
- Review security updates
- Clean old Docker images
- Test backup restoration

**Quarterly:**
- Review and update dependencies
- Security audit
- Performance review

### Updating the Application

**Method 1: Manual Update**

```bash
cd /opt/gsd

# Pull latest changes
git pull origin main

# Rebuild images
docker compose build

# Restart services
docker compose up -d --force-recreate

# Run migrations
docker compose exec backend npm run db:migrate:deploy

# Verify
curl https://gsd.yourdomain.com/api/health
```

**Method 2: Automated via CI/CD**

See CI/CD Pipeline section above.

### Updating Docker Images

```bash
# Pull latest base images
docker compose pull

# Rebuild and restart
docker compose up -d --build

# Clean up old images
docker image prune -a
```

### Zero-Downtime Updates

For production with no downtime:

1. Use Docker Swarm or Kubernetes (advanced)
2. Run multiple backend instances with load balancing
3. Rolling updates with health checks

For MVP single-server setup, brief downtime (<30s) during updates is acceptable.

---

## Troubleshooting

### Common Issues

**1. Port 80/443 Already in Use**

```bash
# Check what's using the ports
sudo lsof -i :80
sudo lsof -i :443

# If Apache/Nginx is running
sudo systemctl stop apache2
sudo systemctl disable apache2
```

**2. Database Connection Failed**

```bash
# Check PostgreSQL health
docker compose exec postgres pg_isready -U gsd_user -d gsd

# Check logs
docker compose logs postgres

# Verify DATABASE_URL in backend
docker compose exec backend env | grep DATABASE_URL
```

**3. Backend Returns 502 Bad Gateway**

```bash
# Check backend is running
docker compose ps backend

# Check backend logs
docker compose logs backend

# Check backend health
docker compose exec backend curl http://localhost:3000/health

# Restart backend
docker compose restart backend
```

**4. SSL Certificate Issues**

```bash
# Check certificate files exist
ls -la /opt/gsd/certbot/conf/live/gsd.yourdomain.com/

# Re-obtain certificate
docker compose run --rm certbot certonly --webroot \
    --webroot-path /var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --force-renewal \
    -d gsd.yourdomain.com

# Reload nginx
docker compose exec nginx-proxy nginx -s reload
```

**5. Frontend Not Loading**

```bash
# Check frontend logs
docker compose logs frontend

# Check nginx proxy logs
docker compose logs nginx-proxy

# Test frontend container directly
docker compose exec frontend wget -O- http://localhost:80/

# Check nginx config
docker compose exec nginx-proxy nginx -t
```

### Emergency Procedures

**Complete Service Restart:**

```bash
cd /opt/gsd
docker compose down
docker compose up -d
```

**Database Recovery from Backup:**

```bash
# Stop backend
docker compose stop backend

# Restore (see Database Management section)
gunzip -c /opt/gsd/backups/gsd-YYYYMMDD-HHMMSS.sql.gz | \
    docker compose exec -T postgres psql -U gsd_user -d gsd

# Start backend
docker compose start backend
```

**Full System Reset (Nuclear Option):**

```bash
# DANGER: This will delete all data!
cd /opt/gsd
docker compose down -v
docker system prune -a --volumes
# Then redeploy from scratch
```

### Performance Issues

**High CPU/Memory:**

```bash
# Check resource usage
docker stats

# Check running processes in containers
docker compose exec backend top
docker compose exec postgres top

# Review logs for errors
docker compose logs --tail=100 backend
```

**Slow Database Queries:**

```bash
# Enable query logging (temporary)
docker compose exec postgres psql -U gsd_user -d gsd -c \
    "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Reload config
docker compose exec postgres psql -U gsd_user -d gsd -c \
    "SELECT pg_reload_conf();"

# Check logs
docker compose logs postgres | grep "duration:"
```

---

## Appendix

### Complete File Structure

```
/opt/gsd/
├── .env                        # Environment variables
├── docker-compose.yml          # Main orchestration
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── ... (backend code)
│   └── frontend/
│       ├── Dockerfile
│       └── ... (frontend code)
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── gsd.conf
├── certbot/
│   ├── conf/                   # SSL certificates
│   └── www/                    # ACME challenge
├── backups/                    # Database backups
├── scripts/
│   ├── backup-db.sh
│   ├── health-check.sh
│   └── offsite-backup.sh
└── logs/                       # Application logs (optional)
```

### Useful Commands Reference

```bash
# Docker Compose
docker compose up -d                    # Start all services
docker compose down                     # Stop all services
docker compose ps                       # List running services
docker compose logs -f [service]        # View logs
docker compose restart [service]        # Restart service
docker compose exec [service] [cmd]     # Execute command in container

# Database
docker compose exec postgres psql -U gsd_user -d gsd
docker compose exec backend npm run db:migrate:deploy

# Health Checks
curl https://gsd.yourdomain.com/health
curl https://gsd.yourdomain.com/api/health

# Backups
/opt/gsd/scripts/backup-db.sh

# Logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx-proxy

# Resource Usage
docker stats
df -h
free -h
```

---

## Next Steps

### Pre-deployment Checklist

- [ ] Server provisioned with Docker installed
- [ ] DNS A and AAAA records configured
- [ ] SSH access configured with key-based auth
- [ ] `.env` file created with all secrets
- [ ] Google OAuth credentials obtained
- [ ] Domain name verified and propagated
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring scripts in place

### Post-deployment Checklist

- [ ] All containers running and healthy
- [ ] SSL certificate obtained and valid
- [ ] Database migrations completed
- [ ] Frontend accessible via HTTPS
- [ ] Backend API responding
- [ ] Authentication flow working
- [ ] Manual backup tested
- [ ] Logs reviewed for errors
- [ ] Performance baseline established
- [ ] Documentation updated with actual values

### Optional Enhancements

- [ ] Set up Prometheus + Grafana monitoring
- [ ] Configure log aggregation (ELK stack or similar)
- [ ] Implement CI/CD with automated testing
- [ ] Add database replication for HA
- [ ] Set up staging environment
- [ ] Configure CDN for static assets
- [ ] Implement rate limiting at firewall level
- [ ] Add intrusion detection (AIDE, OSSEC)

---

**End of Deployment Plan**

**Last Updated:** 2025-12-31
**Version:** 1.0
**Maintainer:** GSD Team
