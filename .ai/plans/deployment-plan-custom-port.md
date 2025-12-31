# GSD Deployment Plan - Single Server Docker (Custom Port)

**Created:** 2025-12-31
**Status:** Planning Phase
**Target Environment:** Single Linux server with Docker, exposed on custom port
**Domain:** https://getsd.bieda.it/ (certificate managed externally)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Docker Services](#docker-services)
5. [Deployment Steps](#deployment-steps)
6. [Environment Configuration](#environment-configuration)
7. [Database Management](#database-management)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Security Considerations](#security-considerations)
12. [Maintenance & Updates](#maintenance--updates)
13. [Troubleshooting](#troubleshooting)

---

## Overview

### Deployment Architecture

**Single-server Docker stack** running on a custom port (e.g., 8080):
- **Frontend**: Astro static site (Nginx container)
- **Backend**: NestJS API (Node.js container)
- **Database**: PostgreSQL (PostgreSQL container)
- **Internal Routing**: Nginx for frontend/backend routing
- **External Access**: Exposed on custom port (e.g., 8080)

### Key Differences from Standard Setup

- ✅ **No SSL management** (handled externally)
- ✅ **No Certbot** (certificate managed by external proxy)
- ✅ **Custom port exposure** (configurable, e.g., 8080)
- ✅ **HTTP-only internally** (SSL terminated at external proxy)
- ✅ **Simplified Nginx config** (no SSL directives)

### Domain Structure

```
https://getsd.bieda.it/
    ↓ (External reverse proxy - SSL termination)
Your Server:8080 (HTTP)
    ↓ (Internal Nginx)
├── /           → Frontend (static files)
└── /api/*      → Backend (NestJS API)
        ↓
    PostgreSQL (internal Docker network)
```

### Network Configuration

- **External Port**: Configurable (default: 8080)
- **Internal Network**: Docker bridge network
- **SSL/TLS**: Handled by external reverse proxy
- **Protocol**: HTTP internally, HTTPS externally

---

## Architecture

### Service Communication Flow

```
Internet (HTTPS)
    ↓
External Reverse Proxy (getsd.bieda.it)
    ↓ SSL Termination
    ↓ Forwards to Your Server:8080 (HTTP)
    ↓
Nginx Reverse Proxy (Container, Port 8080)
    ├── / → Frontend (Nginx static files)
    └── /api/* → Backend (NestJS API :3000)
            ↓
        PostgreSQL:5432 (Docker network only)
```

### Docker Network Architecture

```yaml
gsd-network (bridge, IPv6 enabled)
├── nginx-proxy (exposed: 8080 → 80)
├── frontend (internal: 80)
├── backend (internal: 3000)
└── postgres (internal: 5432)
```

**Key Points:**
- Only Nginx proxy exposed to host on port 8080
- All inter-container communication on internal network
- PostgreSQL not exposed to host (security)

---

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- **OS**: Ubuntu 22.04 LTS or Debian 12
- **CPU**: 2 vCPU
- **RAM**: 4GB (2GB minimum)
- **Storage**: 20GB SSD
- **Network**: IPv4 and/or IPv6 connectivity

**Recommended Specifications:**
- **CPU**: 4 vCPU
- **RAM**: 8GB
- **Storage**: 40GB SSD

### External Reverse Proxy Configuration

Your external reverse proxy (managing getsd.bieda.it) should be configured to:

1. **Forward traffic** to `your-server-ip:8080`
2. **Preserve headers** (X-Forwarded-For, X-Forwarded-Proto, X-Real-IP)
3. **Set X-Forwarded-Proto: https** (important for backend to know it's HTTPS)

**Example Nginx config on external proxy:**

```nginx
server {
    listen 443 ssl http2;
    server_name getsd.bieda.it;

    # SSL certificate (managed externally)
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://your-server-ip:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # Important!
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Firewall Configuration

Open the custom port (e.g., 8080) on your server:

```bash
# UFW
sudo ufw allow 8080/tcp comment 'GSD Application'

# Or iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

### SSH Access

Ensure SSH access is configured:
```bash
ssh user@your-server-ip
```

---

## Docker Services

### Complete docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
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

  # Backend (NestJS API)
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
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_CALLBACK_URL: ${APP_URL}/api/auth/google/callback
      FRONTEND_URL: ${APP_URL}
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

  # Frontend (Astro + Nginx)
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: gsd-frontend
    restart: unless-stopped
    environment:
      PUBLIC_API_URL: ${APP_URL}/api
    networks:
      - gsd-network

  # Nginx Reverse Proxy (Internal Routing)
  nginx-proxy:
    image: nginx:alpine
    container_name: gsd-nginx-proxy
    restart: unless-stopped
    ports:
      - "${EXPOSED_PORT:-8080}:80"
      - "[::]:${EXPOSED_PORT:-8080}:80"  # IPv6
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
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
```

### Key Configuration Points

**Environment Variables:**
- `EXPOSED_PORT`: The port to expose (default: 8080)
- `APP_URL`: Full application URL (https://getsd.bieda.it)
- `DB_PASSWORD`: PostgreSQL password
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID/SECRET`: OAuth credentials

**Port Mapping:**
- Only Nginx proxy exposed on `${EXPOSED_PORT}`
- All other services on internal Docker network only

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

# Add user to docker group
sudo usermod -aG docker $USER

# Enable IPv6 in Docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "ipv6": true,
  "fixed-cidr-v6": "fd00::/80",
  "experimental": true,
  "ip6tables": true,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker

# Install tools
sudo apt install -y git curl wget htop vim ufw
```

### Step 2: Configure Firewall

```bash
# Set up UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 8080/tcp comment 'GSD Application'
sudo ufw enable
sudo ufw status verbose
```

### Step 3: Create Deployment Directory

```bash
# Create directory
sudo mkdir -p /opt/gsd
sudo chown $USER:$USER /opt/gsd
cd /opt/gsd

# Clone repository (option 1: git)
git clone https://github.com/yourusername/gsd.git .

# Or copy files (option 2: scp from local machine)
# On local machine:
# scp -r ./gsd/* user@server-ip:/opt/gsd/
```

### Step 4: Create Environment Configuration

```bash
# Create .env file
cat > /opt/gsd/.env <<EOF
# Application URL (HTTPS, managed externally)
APP_URL=https://getsd.bieda.it

# Exposed port (custom port on your server)
EXPOSED_PORT=8080

# Database Configuration
DB_PASSWORD=$(openssl rand -base64 24)

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF

# Secure the file
chmod 600 /opt/gsd/.env

# Display generated passwords (save these!)
echo "=== Generated Credentials ==="
cat /opt/gsd/.env
echo "=== Save these credentials! ==="
```

### Step 5: Create Nginx Configuration

```bash
# Create nginx directory
mkdir -p /opt/gsd/nginx/conf.d

# Main nginx.conf
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

# Site configuration (HTTP only, no SSL)
cat > /opt/gsd/nginx/conf.d/gsd.conf <<'EOF'
# Rate limiting zones
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

# Main HTTP server
server {
    listen 80;
    listen [::]:80;
    server_name _;  # Accept any hostname (external proxy sets Host header)

    # Trust X-Forwarded-* headers from external proxy
    real_ip_header X-Forwarded-For;
    set_real_ip_from 0.0.0.0/0;  # Trust all (external proxy is trusted)
    set_real_ip_from ::/0;       # IPv6

    # Security headers (even though SSL is external, add for defense in depth)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://backend/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        access_log off;
    }

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
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend - static files
    location / {
        limit_req zone=general_limit burst=50 nodelay;

        proxy_pass http://frontend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1d;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
```

### Step 6: Build and Start Services

```bash
cd /opt/gsd

# Load environment variables
source .env

# Build Docker images
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 7: Run Database Migrations

```bash
# Wait for backend to be healthy
sleep 10

# Run migrations
docker compose exec backend npm run db:migrate:deploy

# Verify database
docker compose exec postgres psql -U gsd_user -d gsd -c "\dt"
```

### Step 8: Verify Deployment

```bash
# Check health endpoint (internal)
curl http://localhost:8080/health
curl http://localhost:8080/api/health

# Check from external URL (after external proxy is configured)
curl https://getsd.bieda.it/health
curl https://getsd.bieda.it/api/health

# Check logs
docker compose logs backend
docker compose logs frontend
docker compose logs nginx-proxy
```

---

## Environment Configuration

### Required Environment Variables

**In `.env` file:**

```bash
# Application URL (full HTTPS URL, managed externally)
APP_URL=https://getsd.bieda.it

# Port to expose on host
EXPOSED_PORT=8080

# Database
DB_PASSWORD=<generated-securely>

# JWT
JWT_SECRET=<generated-securely>
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
```

### Google OAuth Configuration

**Important:** Update your Google OAuth redirect URI:

1. Go to Google Cloud Console
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URI:
   ```
   https://getsd.bieda.it/api/auth/google/callback
   ```

### Changing the Domain

If the domain changes in the future:

```bash
# Update .env
vim /opt/gsd/.env
# Change APP_URL to new domain

# Update Google OAuth redirect URI in Google Cloud Console

# Restart backend (reads new APP_URL)
docker compose restart backend

# No other changes needed!
```

### Changing the Exposed Port

If you need to change the port:

```bash
# Update .env
vim /opt/gsd/.env
# Change EXPOSED_PORT to new port (e.g., 9000)

# Update firewall
sudo ufw allow 9000/tcp
sudo ufw delete allow 8080/tcp

# Recreate containers
docker compose up -d --force-recreate nginx-proxy

# Update external reverse proxy to point to new port
```

---

## Database Management

### Database Access

```bash
# PostgreSQL shell
docker compose exec postgres psql -U gsd_user -d gsd

# Common queries
\dt                     # List tables
\d+ lists               # Describe lists table
SELECT COUNT(*) FROM tasks;
\q                      # Quit
```

### Migrations

```bash
# Run migrations (production)
docker compose exec backend npm run db:migrate:deploy

# Check migration status
docker compose exec backend npx prisma migrate status

# Regenerate Prisma client
docker compose exec backend npm run db:generate
```

### Backups

**Manual Backup:**

```bash
# Create backup directory
mkdir -p /opt/gsd/backups

# Create backup
docker compose exec postgres pg_dump -U gsd_user gsd > \
    /opt/gsd/backups/gsd-$(date +%Y%m%d-%H%M%S).sql

# Compress
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

# Delete old backups
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

# Restore
gunzip -c /opt/gsd/backups/gsd-YYYYMMDD-HHMMSS.sql.gz | \
    docker compose exec -T postgres psql -U gsd_user -d gsd

# Start backend
docker compose start backend
```

---

## Monitoring & Logging

### View Logs

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

### Health Monitoring Script

```bash
mkdir -p /opt/gsd/scripts

cat > /opt/gsd/scripts/health-check.sh <<'EOF'
#!/bin/bash
set -e

# Check via localhost
if ! curl -sf http://localhost:8080/health > /dev/null; then
    echo "ERROR: Health check failed on localhost:8080"
    exit 1
fi

if ! curl -sf http://localhost:8080/api/health > /dev/null; then
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

# Test it
/opt/gsd/scripts/health-check.sh
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df
df -h

# Memory usage
free -h

# Clean up unused resources
docker system prune -a --volumes
```

---

## Backup Strategy

### What to Backup

1. **Database** (Critical)
   - Automated daily backups via cron
   - Keep 7 days local, 30 days off-site

2. **Environment Files** (Critical)
   - `/opt/gsd/.env`
   - Store securely off-server

3. **Configuration Files** (Important)
   - `docker-compose.yml`
   - `nginx/` directory
   - Version controlled in Git

### Off-site Backup

```bash
# Option 1: SCP to remote server
cat > /opt/gsd/scripts/offsite-backup.sh <<'EOF'
#!/bin/bash
REMOTE_USER="backup"
REMOTE_HOST="backup-server.com"
REMOTE_DIR="/backups/gsd"
LOCAL_DIR="/opt/gsd/backups"

rsync -avz --delete "$LOCAL_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
EOF

chmod +x /opt/gsd/scripts/offsite-backup.sh
```

---

## CI/CD Pipeline

### Automated Deployment Options

**Option 1: GitHub Actions + SSH Deploy**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/gsd
            git pull origin main
            docker compose build
            docker compose up -d --force-recreate
            docker compose exec -T backend npm run db:migrate:deploy
```

**Option 2: Build on GitHub, Deploy via Registry**

```yaml
name: Build and Deploy

on:
  push:
    branches:
      - main

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/backend
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/frontend
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

**Option 3: Watchtower Auto-Update**

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
    - WATCHTOWER_POLL_INTERVAL=300  # 5 minutes
  command: gsd-backend gsd-frontend
```

---

## Security Considerations

### Server-Level Security

**1. Firewall:**

```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 8080/tcp
sudo ufw enable
```

**2. Fail2Ban:**

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

**3. SSH Hardening:**

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### Application Security

Since SSL is terminated externally, ensure:

1. **External proxy sets X-Forwarded-Proto: https**
2. **Nginx trusts X-Forwarded-* headers**
3. **Backend reads X-Forwarded-Proto for secure cookies**

Already implemented:
- ✅ HttpOnly cookies
- ✅ SameSite=Strict
- ✅ Rate limiting
- ✅ Input validation
- ✅ Security headers

### Docker Security

**Resource Limits:**

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
```

---

## Maintenance & Updates

### Updating the Application

```bash
cd /opt/gsd

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose build
docker compose up -d --force-recreate

# Run migrations
docker compose exec backend npm run db:migrate:deploy

# Verify
curl http://localhost:8080/health
```

### Regular Maintenance Tasks

**Weekly:**
- Check logs for errors
- Verify backups are running
- Check disk usage

**Monthly:**
- Review security updates
- Clean old Docker images
- Test backup restoration

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8080
sudo lsof -i :8080

# Kill process if needed
sudo kill -9 <PID>
```

### Cannot Access Application

```bash
# Check if nginx-proxy is running
docker compose ps nginx-proxy

# Check nginx logs
docker compose logs nginx-proxy

# Test locally
curl http://localhost:8080/health

# Test from external proxy server
curl http://your-server-ip:8080/health
```

### Backend 502 Errors

```bash
# Check backend health
docker compose exec backend curl http://localhost:3000/health

# Check backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker compose exec postgres pg_isready -U gsd_user -d gsd

# Check DATABASE_URL
docker compose exec backend env | grep DATABASE_URL

# Restart PostgreSQL
docker compose restart postgres
```

---

## Quick Reference

### Essential Commands

```bash
# Start services
cd /opt/gsd && docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart service
docker compose restart <service>

# Run migrations
docker compose exec backend npm run db:migrate:deploy

# Backup database
/opt/gsd/scripts/backup-db.sh

# Health check
curl http://localhost:8080/health
```

### File Structure

```
/opt/gsd/
├── .env                    # Environment variables
├── docker-compose.yml      # Main orchestration
├── apps/
│   ├── backend/
│   └── frontend/
├── nginx/
│   ├── nginx.conf
│   └── conf.d/gsd.conf
├── backups/                # Database backups
└── scripts/
    ├── backup-db.sh
    └── health-check.sh
```

---

## Pre-deployment Checklist

- [ ] Server provisioned with Docker installed
- [ ] Firewall configured (port 8080 open)
- [ ] SSH access configured
- [ ] `.env` file created with all secrets
- [ ] Google OAuth credentials obtained and configured
- [ ] External reverse proxy pointing to your-server-ip:8080
- [ ] External proxy sets X-Forwarded-Proto header
- [ ] Backup strategy implemented
- [ ] Health monitoring in place

## Post-deployment Checklist

- [ ] All containers running
- [ ] Database migrations completed
- [ ] Health checks passing (localhost:8080/health)
- [ ] External access working (https://getsd.bieda.it)
- [ ] Authentication flow tested
- [ ] Manual backup tested
- [ ] Logs reviewed
- [ ] Performance verified

---

**End of Deployment Plan**

**Last Updated:** 2025-12-31
**Version:** 2.0 (Custom Port)
**Maintainer:** GSD Team
