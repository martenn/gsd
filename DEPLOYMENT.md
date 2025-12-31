# GSD Deployment Guide

**Version:** 1.0
**Last Updated:** 2025-12-31
**Target:** Single Linux server with Docker (Port 8080)
**Domain:** https://getsd.bieda.it

---

## 📋 Quick Start

For experienced users:

```bash
# On your server
git clone <repository-url> /opt/gsd
cd /opt/gsd
./scripts/setup-env.sh
docker compose up -d
./scripts/health-check.sh
```

---

## 🎯 Prerequisites

### Server Requirements

- **OS:** Ubuntu 22.04 LTS or Debian 12
- **CPU:** 2+ vCPU (4 recommended)
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 20GB SSD minimum
- **Network:** IPv4 and/or IPv6 connectivity
- **Access:** SSH access to server

### Software Requirements

- Docker Engine 24.0+
- Docker Compose v2.20+
- Git (for deployment from repository)

### External Requirements

1. **Google OAuth Credentials**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://getsd.bieda.it/api/auth/google/callback`

2. **External Reverse Proxy**
   - Must forward traffic from https://getsd.bieda.it to `your-server-ip:8080`
   - Must set `X-Forwarded-Proto: https` header
   - Must preserve `X-Real-IP` and `X-Forwarded-For` headers

---

## 🚀 Deployment Steps

### Step 1: Prepare Server

```bash
# SSH into your server
ssh user@your-server-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Logout and login again for group changes to take effect
exit
```

### Step 2: Configure Docker for IPv6 (Optional)

```bash
# SSH back in
ssh user@your-server-ip

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

# Restart Docker
sudo systemctl restart docker
```

### Step 3: Configure Firewall

```bash
# Install UFW (if not already installed)
sudo apt install ufw -y

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 8080/tcp comment 'GSD Application'

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status verbose
```

### Step 4: Deploy Application

```bash
# Create deployment directory
sudo mkdir -p /opt/gsd
sudo chown $USER:$USER /opt/gsd

# Clone repository (or copy files via scp)
git clone <your-repository-url> /opt/gsd
cd /opt/gsd

# Or copy files manually:
# scp -r ./gsd/* user@server:/opt/gsd/
```

### Step 5: Configure Environment

```bash
cd /opt/gsd

# Run environment setup script
./scripts/setup-env.sh

# The script will prompt you for:
# - Application URL (default: https://getsd.bieda.it)
# - Google Client ID
# - Google Client Secret
# - JWT Expiration (default: 7d)

# It will automatically generate:
# - Database password (24 characters)
# - JWT secret (32 characters)
```

**Alternative: Manual Configuration**

```bash
# Copy example environment file
cp .env.example .env

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)

# Edit .env file
nano .env

# Fill in all required values:
# - APP_URL=https://getsd.bieda.it
# - DB_PASSWORD=<generated-password>
# - JWT_SECRET=<generated-secret>
# - GOOGLE_CLIENT_ID=<your-client-id>
# - GOOGLE_CLIENT_SECRET=<your-client-secret>

# Secure the file
chmod 600 .env
```

### Step 6: Build and Start Services

```bash
cd /opt/gsd

# Build Docker images
docker compose build

# Start all services
docker compose up -d

# View logs (optional)
docker compose logs -f
```

### Step 7: Run Database Migrations

```bash
# Wait for backend to be healthy (about 30 seconds)
sleep 30

# Run migrations
docker compose exec backend npm run db:migrate:deploy

# Verify database tables were created
docker compose exec postgres psql -U gsd_user -d gsd -c "\dt"
```

### Step 8: Verify Deployment

```bash
# Run health check script
./scripts/health-check.sh

# Or manually check endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/health

# Check from external URL (after external proxy is configured)
curl https://getsd.bieda.it/health
```

---

## 🔧 Configuration

### Environment Variables

All configuration is in `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_URL` | Full application URL (HTTPS) | `https://getsd.bieda.it` |
| `DB_PASSWORD` | PostgreSQL password | (auto-generated) |
| `JWT_SECRET` | JWT signing secret | (auto-generated) |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `<from-google-console>` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `<from-google-console>` |

### Changing Configuration

```bash
# Edit .env
nano /opt/gsd/.env

# Restart affected services
docker compose restart backend  # For backend env vars
docker compose restart frontend # For frontend env vars
```

### Port Configuration

The application is exposed on **port 8080** (configured in `docker-compose.yml`).

To change the port:

```yaml
# Edit docker-compose.yml
services:
  nginx-proxy:
    ports:
      - "9000:80"  # Change 8080 to desired port
```

Then restart:

```bash
docker compose up -d --force-recreate nginx-proxy
```

---

## 🗄️ Database Management

### Accessing the Database

```bash
# PostgreSQL shell
docker compose exec postgres psql -U gsd_user -d gsd

# Common commands
\dt              # List tables
\d+ lists        # Describe lists table
SELECT COUNT(*) FROM tasks;
\q               # Quit
```

### Database Backups

**Manual Backup:**

```bash
./scripts/backup-db.sh
```

Backups are stored in `/opt/gsd/backups/` and kept for 7 days.

**Automated Backups (Cron):**

```bash
# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/gsd/scripts/backup-db.sh >> /var/log/gsd-backup.log 2>&1
```

**Restore from Backup:**

```bash
# Stop backend
docker compose stop backend

# List available backups
ls -lh /opt/gsd/backups/

# Restore specific backup
gunzip -c /opt/gsd/backups/gsd-YYYYMMDD-HHMMSS.sql.gz | \
    docker compose exec -T postgres psql -U gsd_user -d gsd

# Start backend
docker compose start backend
```

---

## 📊 Monitoring

### Health Checks

```bash
# Run health check script
./scripts/health-check.sh

# Or check individual endpoints
curl http://localhost:8080/health         # Nginx + Backend
curl http://localhost:8080/api/health     # Backend only
curl http://localhost:8080/               # Frontend
```

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

# Follow logs from specific time
docker compose logs --since 30m -f backend
```

### Resource Usage

```bash
# Container stats (CPU, memory, network)
docker stats

# Disk usage
docker system df
df -h /opt/gsd

# Check memory
free -h
```

---

## 🔄 Updates and Maintenance

### Updating the Application

**Option 1: Using deploy script**

```bash
cd /opt/gsd
./scripts/deploy.sh
```

**Option 2: Manual update**

```bash
cd /opt/gsd

# Pull latest changes (if using git)
git pull origin main

# Rebuild images
docker compose build

# Restart services
docker compose up -d --force-recreate

# Run migrations
docker compose exec backend npm run db:migrate:deploy

# Verify
./scripts/health-check.sh
```

### Updating Docker Images

```bash
# Pull latest base images
docker compose pull

# Rebuild and restart
docker compose up -d --build --force-recreate
```

### Cleaning Up

```bash
# Remove old Docker images
docker image prune -a

# Remove all unused resources (careful!)
docker system prune -a --volumes
```

---

## 🛡️ Security

### Server Security

1. **Firewall:** Only ports 22 and 8080 should be open
2. **SSH:** Use key-based authentication, disable password login
3. **Fail2Ban:** Install to protect against brute force attacks
4. **Updates:** Keep system packages updated

```bash
# Install Fail2Ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Harden SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Auto security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Application Security

Already implemented:
- ✅ HTTPS (via external proxy)
- ✅ HttpOnly cookies with SameSite=Strict
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Rate limiting (API: 10 req/s, General: 30 req/s)
- ✅ Input validation and sanitization
- ✅ Database password protection

### Secrets Management

```bash
# Secure .env file
chmod 600 /opt/gsd/.env

# Backup credentials securely
# Store DB_PASSWORD and JWT_SECRET in a password manager
```

---

## 🐛 Troubleshooting

### Application Not Accessible

```bash
# Check if containers are running
docker compose ps

# Check nginx proxy
docker compose logs nginx-proxy
curl http://localhost:8080/health

# Check external proxy configuration
# Ensure it forwards to: your-server-ip:8080
# Ensure X-Forwarded-Proto: https header is set
```

### Backend Errors (502 Bad Gateway)

```bash
# Check backend health
docker compose exec backend curl http://localhost:3000/health

# Check backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Database Connection Failed

```bash
# Check PostgreSQL
docker compose exec postgres pg_isready -U gsd_user -d gsd

# Check DATABASE_URL
docker compose exec backend env | grep DATABASE_URL

# Restart database
docker compose restart postgres
```

### Google OAuth Not Working

1. **Check redirect URI in Google Console:**
   - Must be: `https://getsd.bieda.it/api/auth/google/callback`
   - Exact match required (HTTPS, correct domain)

2. **Check environment variables:**
   ```bash
   docker compose exec backend env | grep GOOGLE
   ```

3. **Check external proxy:**
   - Ensure X-Forwarded-Proto header is set to "https"
   - Backend needs to know it's behind HTTPS proxy

### Port 8080 Already in Use

```bash
# Check what's using port 8080
sudo lsof -i :8080

# Kill the process if needed
sudo kill -9 <PID>

# Or change the port in docker-compose.yml
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -a --volumes

# Remove old backups
find /opt/gsd/backups -name "*.sql.gz" -mtime +7 -delete
```

### Complete Reset (Nuclear Option)

```bash
# WARNING: This deletes ALL data!
cd /opt/gsd
docker compose down -v
docker system prune -a --volumes
# Then redeploy from step 5
```

---

## 📚 Common Commands

### Docker Compose

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# View status
docker compose ps

# View logs
docker compose logs -f [service]

# Execute command in container
docker compose exec backend <command>

# Build and restart
docker compose up -d --build --force-recreate
```

### Database

```bash
# Run migrations
docker compose exec backend npm run db:migrate:deploy

# Access database shell
docker compose exec postgres psql -U gsd_user -d gsd

# Backup database
./scripts/backup-db.sh

# Restore database
gunzip -c backups/gsd-YYYYMMDD-HHMMSS.sql.gz | \
    docker compose exec -T postgres psql -U gsd_user -d gsd
```

### Maintenance

```bash
# Health check
./scripts/health-check.sh

# Deploy updates
./scripts/deploy.sh

# View all logs
docker compose logs -f

# Check disk usage
docker system df
df -h

# Clean up
docker image prune -a
docker system prune -a
```

---

## 🆘 Support

### Logs Location

- **Application logs:** `docker compose logs`
- **Nginx logs:** `docker compose logs nginx-proxy`
- **Backup logs:** `/var/log/gsd-backup.log` (if using cron)

### Diagnostic Information

When reporting issues, include:

```bash
# System info
uname -a
docker --version
docker compose version

# Service status
docker compose ps

# Recent logs
docker compose logs --tail=100

# Environment (sanitized)
cat .env | grep -v PASSWORD | grep -v SECRET
```

---

## 📝 File Structure

```
/opt/gsd/
├── .env                    # Environment configuration (created by you)
├── .env.example            # Environment template
├── docker-compose.yml      # Main orchestration file
├── DEPLOYMENT.md           # This file
├── apps/
│   ├── backend/            # NestJS API
│   │   └── Dockerfile
│   └── frontend/           # Astro frontend
│       └── Dockerfile
├── nginx/
│   ├── nginx.conf          # Main Nginx configuration
│   └── conf.d/
│       └── gsd.conf        # Site configuration
├── scripts/
│   ├── setup-env.sh        # Environment setup script
│   ├── deploy.sh           # Deployment script
│   ├── backup-db.sh        # Database backup script
│   └── health-check.sh     # Health check script
└── backups/                # Database backups (created automatically)
    └── gsd-*.sql.gz
```

---

## ✅ Deployment Checklist

### Pre-deployment

- [ ] Server provisioned with Ubuntu/Debian
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (ports 22, 8080)
- [ ] SSH access configured
- [ ] Google OAuth credentials obtained
- [ ] External reverse proxy configured to forward to port 8080

### During deployment

- [ ] Repository cloned to /opt/gsd
- [ ] `.env` file created with all values
- [ ] Docker images built successfully
- [ ] All containers started
- [ ] Database migrations completed
- [ ] Health checks passing

### Post-deployment

- [ ] Application accessible at https://getsd.bieda.it
- [ ] Login with Google OAuth working
- [ ] Database backups configured (cron)
- [ ] Monitoring in place
- [ ] Logs reviewed for errors
- [ ] Credentials backed up securely

---

## 🔗 External Resources

- **Docker Documentation:** https://docs.docker.com/
- **Docker Compose Reference:** https://docs.docker.com/compose/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Google OAuth Setup:** https://console.cloud.google.com/apis/credentials
- **Nginx Documentation:** https://nginx.org/en/docs/

---

**End of Deployment Guide**

For detailed architecture and planning information, see: `.ai/plans/deployment-plan-custom-port.md`
