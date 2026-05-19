# GSD Deployment Guide

**Version:** 2.0 (merged)
**Last Updated:** 2026-05-18
**Target:** Single Linux server with Docker (Port 8080)
**Domain:** https://getsd.bieda.it

This is the comprehensive deployment guide for GSD (Getting Shit Done).

---

## Table of Contents

1. Overview & Deployment Strategies
2. Environments (local, staging, production, Mikrus)
3. Prerequisites
4. Preparing the Deployment Package
5. Manual Deployment Steps
6. Configuration
7. Mikrus-Specific Notes
8. GitHub Actions / CI Deployment
9. SSH Setup for CI
10. Database Management
11. Monitoring
12. Updates and Maintenance
13. Security
14. Troubleshooting & Rollback
15. Common Commands
16. File Structure & Checklists

---

## 1. Overview & Deployment Strategies

GSD is deployed as a set of Docker containers fronted by an internal nginx
reverse proxy on a single Linux host. An *external* reverse proxy (e.g. the
mikrus edge, a Cloudflare tunnel, or a separate nginx VM) terminates TLS and
forwards traffic to the application port (default `8080`).

### Strategy Comparison

| Strategy | Automation | Safety | Complexity | Best For |
|----------|-----------|--------|------------|----------|
| **Image-Only Builds** | Low | High | Low | Manual deployment control |
| **Manual Deployment with Approvals** | Medium | High | Medium | **Recommended for GSD** |
| **Auto-Deploy on Push** | High | Medium | Medium | Mature projects with comprehensive tests |
| **Scheduled Deployments** | High | Medium | Medium | Predictable deployment windows |
| **Watchtower Auto-Pull** | High | Low | Low | Simple setups, risky |
| **Blue-Green Deployment** | High | High | High | Zero-downtime requirements |
| **Environment-Based** | High | High | High | Multi-environment setups |

### Strategy 1: Image-Only Builds (Current Default)

- Builds Docker images on push and pushes to registry (GHCR or Docker Hub).
- Does NOT deploy to production.
- Implementation: `.github/workflows/docker-build.yml`, triggered via
  `workflow_dispatch`, includes Trivy security scanning.

```bash
# 1. Trigger workflow manually on GitHub
# 2. SSH to server and deploy:
ssh user@server
cd /opt/gsd
docker compose pull
docker compose up -d --force-recreate
docker compose exec backend npm run db:migrate:deploy
```

Pros: complete manual control, pre-built/tested images, no accidental deploys.
Cons: requires manual SSH; two-step process.

### Strategy 2: Manual Deployment with Approvals (RECOMMENDED)

- Runs tests, builds images, pushes to GHCR, deploys via SSH, runs health
  check, auto-rollback on failure. Requires manual trigger.
- Implementation: `.github/workflows/deploy-production.yml`, triggered via
  `workflow_dispatch` (with option to skip tests in emergencies).

```
Manual Trigger → Run Tests → Build Images → Deploy to Server → Health Check
                                                ↓ (if fails)
                                              Rollback
```

How to use:
1. Go to GitHub Actions → **Deploy to Production**.
2. Click **Run workflow**, select branch (usually `main`).
3. Choose whether to skip tests (default: run tests).
4. Click **Run workflow**.

The workflow will: run tests (if not skipped), build backend and frontend
images, push to GHCR, SSH into the server, pull new images, restart
containers, run migrations, verify health, and rollback on failure.

Required GitHub Secrets:

```bash
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=your-ssh-user
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_SSH_PORT=22  # optional, defaults to 22
```

### Strategy 3: Auto-Deploy on Push to Main

Automatically deploys whenever code is pushed to `main`. Enable by
uncommenting in `.github/workflows/deploy-production.yml`:

```yaml
on:
  workflow_dispatch:
    # ... existing inputs
  push:
    branches:
      - main
```

Pros: zero manual effort, fast feedback loop, encourages small frequent
deployments.
Cons: risky — every push to main goes to production; requires excellent test
coverage; harder to control timing.

Prerequisites before enabling:
- Comprehensive unit + e2e tests
- Branch protection on `main` (require PR reviews)
- Recommended: staging environment, feature flags

### Strategy 4: Scheduled Deployments

Deploys at fixed times via cron schedule. Useful for predictable windows.

```yaml
on:
  workflow_dispatch:
    # ... existing inputs
  schedule:
    - cron: '0 2 * * *'   # Daily at 2 AM UTC
```

Cron examples:

```yaml
- cron: '0 2 * * *'      # Daily at 2 AM UTC
- cron: '0 14 * * 1'     # Every Monday at 2 PM UTC
- cron: '0 0 * * 0'      # Every Sunday at midnight UTC
- cron: '0 9 * * 1-5'    # Weekdays at 9 AM UTC
```

Pros: predictable, low-traffic deploys, batches changes.
Cons: deploys even with no changes; fixed schedule may not fit needs.

### Strategy 5: Watchtower Auto-Pull

Watchtower container polls the registry and auto-restarts containers when new
images appear.

```yaml
services:
  watchtower:
    # cSpell:ignore containrrr
    image: containrrr/watchtower
    container_name: gsd-watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_POLL_INTERVAL=300  # Check every 5 minutes
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_RESTARTING=true
    restart: unless-stopped
```

**Not recommended for GSD:** no health checks, no rollback, no migration
handling; can break production silently.

### Strategy 6: Blue-Green Deployment

Two parallel environments (Blue, Green); deploys to inactive one and switches
traffic. Zero downtime, instant rollback. Requires load balancer and 2× the
resources. Overkill for the current single-user GSD MVP.

### Strategy 7: Environment-Based Workflows

Separate workflows per environment (staging, production, promotion):

```
.github/workflows/
├── deploy-staging.yml    # Auto-deploy on push to develop
├── deploy-production.yml # Manual deploy from main
└── promote-to-prod.yml   # Promote staging → production
```

Suited for team/enterprise projects. Currently overkill for GSD MVP.

### Recommended Strategy for GSD

**Current phase (MVP):** Strategy 2 — Manual Deployment with Approvals.

Why: control over when to deploy, automated safety (tests, health checks,
rollback), single workflow, no extra infrastructure.

**Future:** consider Strategy 3 (auto-deploy on push) once test coverage is
>80%, the team is confident in the test suite, and deployment cycles need to
accelerate. Add a staging environment first.

### Deployment Best Practices

1. Run tests before every deploy (unit + integration + e2e).
2. Include health checks (backend, frontend, DB connectivity).
3. Have a rollback plan — automatic + documented manual procedure +
   migration rollback strategy.
4. Monitor deployments — check workflow + app logs; verify key functionality.
5. Migrations: run before starting new code; test in staging; have rollback
   SQL; avoid destructive migrations in production.
6. Secrets: never commit; use GitHub Secrets; rotate periodically.
7. Timing: deploy in low-traffic windows; avoid Fridays; monitor 10–15 min
   after deploy; communicate to users (if multi-user).

---

## 2. Environments

### Local Development

Standard `docker compose up -d` from a checkout. See the project root README
for dev workflow.

### Staging

Not provisioned for the MVP. To add later, replicate the production setup on
a separate host or use Strategy 7 (environment-based workflows).

### Production (Generic Linux Host)

- Linux VPS (Ubuntu 22.04 / Debian 12), Docker 24+, Docker Compose v2.20+
- App exposed on host port `8080` (configurable)
- TLS terminated by external reverse proxy
- Database: PostgreSQL in container, volume-backed
- Backups: nightly `pg_dump` cron job, kept 7 days

### Production (Mikrus VPS)

`artur131.mikrus.xyz` (LXC/OpenVZ container) — read Section 7 before
deploying. Requires `docker-compose.yml` restructuring for host networking,
unprivileged nginx image, explicit IPv6 listener. TLS termination and domain
attachment are handled by the mikrus admin panel.

---

## 3. Prerequisites

> **Host-specific notes:** If deploying to the chosen Mikrus VPS
> (`artur131.mikrus.xyz`), read Section 7 first — LXC kernel restrictions
> require non-trivial `docker-compose.yml` changes (host networking,
> unprivileged nginx image, explicit IPv6 listen).

### Server Requirements

- **OS:** Ubuntu 22.04 LTS or Debian 12
- **CPU:** 2+ vCPU (4 recommended)
- **RAM:** 4 GB minimum (8 GB recommended)
- **Storage:** 20 GB SSD minimum
- **Network:** IPv4 and/or IPv6 connectivity
- **Access:** SSH access

### Software Requirements

- Docker Engine 24.0+
- Docker Compose v2.20+
- Git (for deploy-from-repo flow)

### External Requirements

1. **Google OAuth Credentials**
   - https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Authorized redirect URI: `https://getsd.bieda.it/api/auth/google/callback`

2. **External Reverse Proxy**
   - Forwards `https://getsd.bieda.it` → `your-server-ip:8080`
   - Sets `X-Forwarded-Proto: https`
   - Preserves `X-Real-IP` and `X-Forwarded-For`

---

## 4. Preparing the Deployment Package

If deploying manually without git on the server:

```bash
# On your development machine
pnpm package:deployment
# Creates: dist/gsd-deployment-YYYYMMDD-HHMMSS.zip
```

Package contents:
- `docker-compose.yml` — container orchestration
- `.env.example` — environment template
- `nginx/` — reverse proxy configuration
- `scripts/` — deployment and maintenance scripts
- Documentation files

**Note:** Docker images are pulled from GHCR. The package does NOT include
application source code.

### Quick Start (Experienced Users)

**Option A: Using Git (Recommended)**

```bash
# On your server
git clone <repository-url> /opt/gsd
cd /opt/gsd
./scripts/setup-env.sh
docker compose up -d
./scripts/health-check.sh
```

**Option B: Using Deployment Package**

```bash
# On your server (after uploading the zip file)
unzip gsd-deployment-YYYYMMDD-HHMMSS.zip
sudo mv gsd-deployment-YYYYMMDD-HHMMSS /opt/gsd
cd /opt/gsd
./scripts/setup-env.sh
docker compose up -d
./scripts/health-check.sh
```

---

## 5. Manual Deployment Steps

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
ssh user@your-server-ip

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
```

### Step 3: Configure Firewall

```bash
sudo apt install ufw -y

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 8080/tcp comment 'GSD Application'

sudo ufw enable
sudo ufw status verbose
```

### Step 4: Deploy Application

**Option A: Using Git**

```bash
sudo mkdir -p /opt/gsd
sudo chown $USER:$USER /opt/gsd
git clone <your-repository-url> /opt/gsd
cd /opt/gsd
```

**Option B: Using Deployment Package**

```bash
sudo mkdir -p /opt/gsd
# Upload gsd-deployment-YYYYMMDD-HHMMSS.zip to server first
unzip gsd-deployment-YYYYMMDD-HHMMSS.zip
sudo mv gsd-deployment-YYYYMMDD-HHMMSS/* /opt/gsd/
sudo chown -R $USER:$USER /opt/gsd
cd /opt/gsd
```

### Step 5: Configure Environment

```bash
cd /opt/gsd
./scripts/setup-env.sh

# The script will prompt for:
# - Application URL (default: https://getsd.bieda.it)
# - Google Client ID
# - Google Client Secret
# - JWT Expiration (default: 7d)
#
# It will auto-generate:
# - Database password (24 characters)
# - JWT secret (32 characters)
```

**Alternative: Manual Configuration**

```bash
cp .env.example .env

DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)

nano .env
# Fill in:
# - APP_URL=https://getsd.bieda.it
# - DB_PASSWORD=<generated-password>
# - JWT_SECRET=<generated-secret>
# - GOOGLE_CLIENT_ID=<your-client-id>
# - GOOGLE_CLIENT_SECRET=<your-client-secret>

chmod 600 .env
```

### Step 6: Build and Start Services

```bash
cd /opt/gsd
docker compose build
docker compose up -d
docker compose logs -f   # optional
```

### Step 7: Run Database Migrations

> **First deploy (empty database) — read this first.**
> The backend container crashloops on a fresh schema (Prisma can't find the
> expected tables on boot), so `docker compose exec backend ...` will never
> find a running container. Use a one-off migration container instead, with
> the backend stopped to avoid a race on the schema:
>
> ```bash
> docker compose up -d postgres                 # ensure DB is healthy
> docker compose stop backend                   # stop the crashlooper
>
> docker compose run --rm --no-deps backend \
>   npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
>
> docker compose exec postgres psql -U gsd_user -d gsd -c "\dt"
> docker compose start backend                  # boots clean now
> ```
>
> Once the schema exists, subsequent migrations (after image upgrades) can use
> the simpler in-place flow below.

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
./scripts/health-check.sh

# Or manually
curl http://localhost:8080/health
curl http://localhost:8080/api/health

# External (after proxy configured)
curl https://getsd.bieda.it/health
```

---

## 6. Configuration

### Environment Variables

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
nano /opt/gsd/.env

docker compose restart backend   # For backend env vars
docker compose restart frontend  # For frontend env vars
```

### Port Configuration

The application is exposed on **port 8080** (configured in
`docker-compose.yml`).

To change:

```yaml
services:
  nginx-proxy:
    ports:
      - "9000:80"  # Change 8080 to desired port
```

```bash
docker compose up -d --force-recreate nginx-proxy
```

---

## 7. Mikrus-Specific Notes

**Status:** Captured from pesel-birth-date deployment to `artur131.mikrus.xyz`
(2026-05-18). Applies to GSD deployment to the same host.

This section captures server-specific quirks discovered while deploying a
sibling project to the target Mikrus VPS. The lessons transfer to GSD because
the *exposure* model (mikrus panel subdomain → local port, with mikrus
terminating TLS) is identical, even though GSD's image distribution differs
(GHCR pull vs local build).

### Target Server Profile

- **Host:** `artur131.mikrus.xyz` (custom SSH port)
- **Type:** LXC/OpenVZ container (not full VM)
- **Kernel:** Restricted — most `/proc/sys` paths are read-only
- **Networking:** IPv6-primary; IPv4 NAT'd
- **Docker:** Installed, but constrained by the kernel restrictions above
- **External exposure:** Mikrus admin panel maps
  `artur131.mikrus.xyz/<subpath>` (or a configured subdomain) → local TCP port

### Critical Gotchas

#### 1. Docker bridge networking fails

**Symptom (container init):**
```
runc create failed: ... open sysctl net.ipv4.ip_unprivileged_port_start file:
reopen fd 8: permission denied
```

**Cause:** Docker 25+ tries to write `net.ipv4.ip_unprivileged_port_start=0`
into the container's network namespace on every container start. LXC blocks
sysctl writes.

**Fix:** Use `network_mode: host` in `docker-compose.yml`. Container shares
the host network namespace — no new namespace, no sysctl writes.

**Consequence for GSD:** every service that currently relies on the Docker
bridge needs adjustment. Specifically:
- `nginx-proxy` service: drop `ports:` mapping, configure nginx to
  `listen <port>` directly
- `backend` and `frontend` services: they reach each other via
  `localhost:<port>` (since they all share the host net), **not** via
  service-name DNS (which only works inside the bridge)
- `postgres`: bind to `127.0.0.1:5432` on the host, backend talks to
  `127.0.0.1:5432`
- All inter-service port collisions must be resolved at the host level

This is a non-trivial change to the existing `docker-compose.yml`. Re-evaluate
whether to:
- (a) keep bridge networking and find a way to suppress the sysctl write
  (unclear if possible without kernel changes)
- (b) restructure for host networking
- (c) deploy GSD to a different host that supports full Docker

#### 2. iptables `DOCKER-FORWARD` chain missing

**Symptom (network create):**
```
Failed to Setup IP tables: ... iptables --wait -t filter -A DOCKER-FORWARD ...:
No chain/target/match by that name. (exit status 1)
```

**Cause:** Docker daemon's iptables state out of sync with kernel — happens
after package updates or kernel module reloads.

**Fix:** `systemctl restart docker`. Restores the chains. Recurs occasionally
— worth knowing for the runbook.

#### 3. Privileged ports (<1024) inside containers

Container processes cannot bind ports below 1024 inside the container's net
namespace under LXC restrictions. Standard `nginx:alpine` (binds 80) fails
even before the sysctl issue surfaces.

**Fix:** use `nginxinc/nginx-unprivileged:alpine` (runs as UID 101, listens on
8080 by default). For GSD's `nginx-proxy` service, swap the base image.

#### 4. IPv6 binding is NOT automatic

Nginx default `listen <port>;` binds IPv4 only. The mikrus reverse proxy may
connect via `[::1]:<port>` — IPv4-only nginx returns connection refused,
surfacing as a 502 at the edge.

**Fix:** add explicit IPv6 listener:
```nginx
server {
    listen 8081;
    listen [::]:8081;
    ...
}
```

Verify on the host: `ss -tlnp | grep <port>` should show both
`0.0.0.0:<port>` and `[::]:<port>`.

#### 5. TLS termination & domain attachment

**Flow:** `getsd.bieda.it` → mikrus edge (handles DNS, TLS termination,
virtual host) → local host port.

- Mikrus admin panel attaches the domain and provisions the certificate. **No
  Cloudflare in the path** for this project.
- Application sees plain HTTP from the mikrus edge proxy with
  `X-Forwarded-Proto: https` headers.
- nginx `set_real_ip_from 0.0.0.0/0` accepts those headers because the mikrus
  edge is the only host reaching local port 8080 (UFW enforces this).

#### 6. Port allocation across projects on this host

> **Variant A / Variant B — port reservation:** the Mikrus-specific table
> below (Variant A) reserves `8081` for the existing pesel-birth-date project
> and proposes `8080` for GSD to match the existing `docker-compose.yml`.
> Variant B (generic single-host deploys elsewhere in this document) uses
> `8080` for GSD with no neighbors. Pick the variant that matches the target
> host.

| Project | Host port | Notes |
|---------|-----------|-------|
| pesel-birth-date | 8081 | static nginx |
| gsd | 8080 (proposed) | matches existing `docker-compose.yml` |

If GSD adopts host networking, **every** service's port must be unique on the
host. Pick now:
- `nginx-proxy`: 8080
- `postgres`: 5432 (only bind to 127.0.0.1, do not expose to the public)
- `backend`: internal port (3000) — only reached by `localhost:3000` from
  nginx, do not expose
- `frontend`: internal port — same constraint

### What Transfers From the Generic Guide Unchanged

- Server prep (Docker install, UFW, SSH hardening)
- `.env` setup pattern, secret generation
- Backup cron, health-check scripts
- Google OAuth callback URL setup
- DB migration step (`prisma migrate deploy`)

### What Needs Revision for Mikrus

- `docker-compose.yml` — likely full restructure for host networking
  (Gotcha #1)
- `nginx/conf.d/gsd.conf` — add IPv6 `listen` lines
- `nginx-proxy` service — switch to `nginx-unprivileged` base image
- Prerequisites — add mikrus-specific bullets

### Recommended Pre-Deployment Validation

Before pushing GSD to mikrus, dry-run on a local Linux VM (or Lima/Multipass
on macOS) configured to mimic the LXC restrictions:
- Disable kernel modules `br_netfilter`, `iptable_filter` if possible
- Mount `/proc/sys/net` read-only

If GSD's compose stack works under these constraints locally, it will work on
mikrus.

### Open Questions for GSD-on-Mikrus

1. **Can postgres run in a host-net container with safe isolation?** It must
   bind only to `127.0.0.1` to avoid public exposure.
2. **Service discovery between backend/frontend without docker DNS?** With
   host networking, use `localhost:<port>` everywhere — but this requires
   every internal port to be unique and known.
3. **Resource limits.** Mikrus tier may have low RAM/CPU. Verify postgres +
   backend + frontend + nginx fit within plan limits before deploying.
4. **Alternative: deploy GSD elsewhere.** If host-networking refactor is too
   invasive, consider a small VPS with full virtualization (Hetzner CX11, DO
   basic droplet) and use mikrus only for static/small projects.

---

## 8. GitHub Actions / CI Deployment

The recommended workflow for GSD is `.github/workflows/deploy-production.yml`
(Strategy 2 above). This section is the operational runbook.

### Required GitHub Secrets

Add via **GitHub repo → Settings → Secrets and variables → Actions**:

| Secret | Value | Example |
|--------|-------|---------|
| `PRODUCTION_HOST` | Server IP or domain | `203.0.113.42` or `server.example.com` |
| `PRODUCTION_USER` | SSH username on server | `deploy` or `ubuntu` |
| `PRODUCTION_SSH_KEY` | **Entire private key contents** (incl. BEGIN/END) | see Section 9 |
| `PRODUCTION_SSH_PORT` | SSH port (optional) | `22` (default) |

### Migration Path: from Current State to Manual-with-Approvals

**Step 1: Configure GitHub Secrets** (all four above).

**Step 2: Test workflow**

```bash
git add .
git commit -m "test: verify deployment workflow"
git push origin main
# Manually trigger workflow in GitHub UI
# Watch deployment process and verify success
```

**Step 3: Document the process** for the team:
- How to trigger deployments
- When to deploy
- What to check after deployment
- How to rollback

**Step 4: Regular use** — for each release:

1. Merge all PRs to `main`
2. Update version in `package.json` (optional)
3. Push to `main`
4. Trigger deployment workflow
5. Monitor deployment
6. Verify in production
7. Monitor for 10–15 minutes

### Future: Move to Auto-Deploy (Optional)

**When to consider:**
- 3+ months of stable deployments
- Comprehensive test coverage
- Confidence in deployment process
- Desire for faster iterations

**How to migrate:**
1. Add staging environment first
2. Auto-deploy to staging on push to `develop`
3. Test extensively in staging
4. Manually promote to production
5. After 1+ month, consider auto-deploy to production

### Don't Use

- **Watchtower** — too risky for database-backed apps (no migration handling,
  no rollback, no health checks)
- **Blue-green** — overkill for single-user MVP
- **Auto-deploy on push** — too early for MVP

---

## 9. SSH Setup for CI

This section explains how to set up SSH authentication for GitHub Actions to
deploy to your production server.

### Step 1: Generate SSH Key Pair

**On your local machine** (NOT on the production server):

```bash
ssh-keygen -t ed25519 -C "github-actions-gsd-deploy" -f ~/.ssh/github-actions-gsd

# Creates:
# ~/.ssh/github-actions-gsd       (private key — for GitHub Secrets)
# ~/.ssh/github-actions-gsd.pub   (public key — for production server)
```

**Important:**
- When prompted for passphrase, **leave it empty** (press Enter twice).
- GitHub Actions cannot use passphrase-protected keys.
- This key should be dedicated to GitHub Actions only.

### Step 2: Add Public Key to Production Server

```bash
# Method 1: Using ssh-copy-id (recommended)
ssh-copy-id -i ~/.ssh/github-actions-gsd.pub your-username@your-server-ip

# Method 2: Manual copy
cat ~/.ssh/github-actions-gsd.pub
# Then SSH to server and add to ~/.ssh/authorized_keys
```

Verify it works:

```bash
ssh -i ~/.ssh/github-actions-gsd your-username@your-server-ip
# Should connect without password. Then exit.
```

### Step 3: Add Private Key to GitHub Secrets

```bash
cat ~/.ssh/github-actions-gsd
# Output:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
# ...
# -----END OPENSSH PRIVATE KEY-----
```

Add to GitHub:
1. Repo **Settings → Secrets and variables → Actions**
2. **New repository secret**
3. Add the four secrets listed in Section 8.

**Important for `PRODUCTION_SSH_KEY`:**
- Copy the ENTIRE private key including the header and footer lines
- Include `-----BEGIN OPENSSH PRIVATE KEY-----`
- Include `-----END OPENSSH PRIVATE KEY-----`
- Include all lines in between
- Don't add quotes or modify the content

### Step 4: Secure the Private Key Locally

```bash
chmod 600 ~/.ssh/github-actions-gsd
# Store securely in a password manager; encrypt if backing up to cloud.
```

### Step 5: Test GitHub Actions Deployment

1. GitHub → **Actions** tab
2. Select **Deploy to Production** workflow
3. **Run workflow** → branch: `main` → keep "Skip tests" unchecked → **Run**

Watch each step; SSH should succeed and deployment should complete.

### Security Best Practices

#### Dedicated Deploy User (Recommended)

```bash
# On production server (as root or with sudo)
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo touch /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Add the GitHub Actions public key
sudo nano /home/deploy/.ssh/authorized_keys
# Paste: ssh-ed25519 AAAA... github-actions-gsd-deploy

sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chown -R deploy:deploy /opt/gsd
```

Then update `PRODUCTION_USER` secret to `deploy`.

#### Restrict SSH Key Access

In `authorized_keys`, prepend restrictions:

```
command="/opt/gsd/scripts/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA... github-actions-gsd-deploy
```

This forces the key to run ONLY the deploy script.

#### Use Environment Protection Rules

In **GitHub Settings → Environments → production**:
- Enable **Required reviewers**
- Set **Wait timer** (delay before deployment)
- Restrict to **specific branches** (only `main`)

#### Rotate Keys Periodically

```bash
# Every 6–12 months
ssh-keygen -t ed25519 -C "github-actions-gsd-deploy-2025" -f ~/.ssh/github-actions-gsd-new
ssh-copy-id -i ~/.ssh/github-actions-gsd-new.pub deploy@server
# Update GitHub Secret with new private key, test, then remove old key from
# server's authorized_keys.
```

### SSH Troubleshooting

#### `Permission denied (publickey)` in workflow

Possible causes:
1. **Private key not copied correctly** — ensure entire key including headers,
   no extra spaces/line breaks.
2. **Public key not on server** — check `~/.ssh/authorized_keys`.
3. **Wrong username** — verify `PRODUCTION_USER`; test with
   `ssh user@server whoami`.
4. **Wrong host** — verify `PRODUCTION_HOST`; `ping your-server-ip`.
5. **Permissions too open** — on server: `chmod 700 ~/.ssh` and
   `chmod 600 ~/.ssh/authorized_keys`.

#### Test SSH Manually

```bash
ssh -i ~/.ssh/github-actions-gsd -p 22 deploy@your-server-ip
# Should connect without password.
```

#### Verify Key Fingerprint

```bash
ssh-keygen -lf ~/.ssh/github-actions-gsd
# On server:
ssh-keygen -lf ~/.ssh/authorized_keys
# Fingerprints must match.
```

### Why Not GitHub Deploy Keys?

Deploy Keys are scoped to a single repo but are **read-only by default** and
cannot trigger workflows or access packages. For deployment we need:
- Write access to pull from GHCR
- Ability to SSH to the server
- Repository-wide access

Use SSH keys in Secrets (as above).

### SSH Setup Checklist

- [ ] SSH key pair generated (ed25519, no passphrase)
- [ ] Public key added to production server's `~/.ssh/authorized_keys`
- [ ] Private key added to GitHub Secret: `PRODUCTION_SSH_KEY`
- [ ] `PRODUCTION_HOST` secret set
- [ ] `PRODUCTION_USER` secret set
- [ ] `PRODUCTION_SSH_PORT` secret set (if not 22)
- [ ] Manual SSH test successful:
      `ssh -i ~/.ssh/github-actions-gsd user@server`
- [ ] GitHub Actions workflow triggered and successful

---

## 10. Database Management

### Accessing the Database

```bash
docker compose exec postgres psql -U gsd_user -d gsd

# Common commands
\dt              # List tables
\d+ lists        # Describe lists table
SELECT COUNT(*) FROM tasks;
\q
```

### Database Backups

**Manual backup:**

```bash
./scripts/backup-db.sh
```

Backups stored in `/opt/gsd/backups/`, kept for 7 days.

**Automated backups (cron):**

```bash
crontab -e

# Daily at 2 AM:
0 2 * * * /opt/gsd/scripts/backup-db.sh >> /var/log/gsd-backup.log 2>&1
```

**Restore from backup:**

```bash
docker compose stop backend

ls -lh /opt/gsd/backups/

gunzip -c /opt/gsd/backups/gsd-YYYYMMDD-HHMMSS.sql.gz | \
    docker compose exec -T postgres psql -U gsd_user -d gsd

docker compose start backend
```

---

## 11. Monitoring

### Health Checks

```bash
./scripts/health-check.sh

# Or check individual endpoints:
curl http://localhost:8080/health         # Nginx + Backend
curl http://localhost:8080/api/health     # Backend only
curl http://localhost:8080/               # Frontend
```

### View Logs

```bash
docker compose logs -f                    # all services

docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f nginx-proxy

docker compose logs --tail=100 backend
docker compose logs --since 30m -f backend
```

### Resource Usage

```bash
docker stats
docker system df
df -h /opt/gsd
free -h
```

---

## 12. Updates and Maintenance

### Updating the Application

**Option 1: Using deploy script**

```bash
cd /opt/gsd
./scripts/deploy.sh
```

**Option 2: Manual update**

```bash
cd /opt/gsd
git pull origin main
docker compose build
docker compose up -d --force-recreate
docker compose exec backend npm run db:migrate:deploy
./scripts/health-check.sh
```

### Updating Docker Images

```bash
docker compose pull
docker compose up -d --build --force-recreate
```

### Cleaning Up

```bash
docker image prune -a
docker system prune -a --volumes   # careful — removes all unused resources
```

---

## 13. Security

### Server Security

1. **Firewall:** Only ports 22 and 8080 should be open.
2. **SSH:** Key-based authentication; disable password login.
3. **Fail2Ban:** Protect against brute-force attacks.
4. **Updates:** Keep system packages up to date.

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd

sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Application Security (Already Implemented)

- HTTPS (via external proxy)
- HttpOnly cookies with `SameSite=Strict`
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting (API: 10 req/s, General: 30 req/s)
- Input validation and sanitization
- Database password protection

### Secrets Management

```bash
chmod 600 /opt/gsd/.env
# Back up DB_PASSWORD and JWT_SECRET in a password manager.
```

---

## 14. Troubleshooting & Rollback

### Application Not Accessible

```bash
docker compose ps
docker compose logs nginx-proxy
curl http://localhost:8080/health
# Verify external proxy forwards to your-server-ip:8080
# and sets X-Forwarded-Proto: https.
```

### Backend Errors (502 Bad Gateway)

```bash
docker compose exec backend curl http://localhost:3000/health
docker compose logs backend
docker compose restart backend
```

### Database Connection Failed

```bash
docker compose exec postgres pg_isready -U gsd_user -d gsd
docker compose exec backend env | grep DATABASE_URL
docker compose restart postgres
```

### Google OAuth Not Working

1. **Check redirect URI in Google Console** — must match exactly:
   `https://getsd.bieda.it/api/auth/google/callback`.
2. **Check environment variables:**
   ```bash
   docker compose exec backend env | grep GOOGLE
   ```
3. **Check external proxy** — `X-Forwarded-Proto: https` must be set.

### Backend Crashloops Before First Migration

**Symptom:** `docker compose ps` shows `backend` cycling between `starting`
and `exited`; logs show Prisma errors about missing tables (`relation "users"
does not exist`, etc.). `docker compose exec backend ...` reports the
container is restarting.

**Cause:** On a brand-new database, the backend boots, queries the schema, and
crashes — Docker restarts it, and the loop repeats. There is never a healthy
backend container to `exec` migrations into.

**Fix:** Run migrations in a throwaway container with the backend stopped:

```bash
docker compose stop backend
docker compose run --rm --no-deps backend \
  npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
docker compose start backend
```

This applies in any environment with an empty Postgres volume — fresh deploy,
restored backup with a newer image, local volume reset.

### Port 8080 Already in Use

```bash
sudo lsof -i :8080
sudo kill -9 <PID>
# Or change port in docker-compose.yml
```

### Out of Disk Space

```bash
df -h
docker system prune -a --volumes
find /opt/gsd/backups -name "*.sql.gz" -mtime +7 -delete
```

### Complete Reset (Nuclear Option)

```bash
# WARNING: This deletes ALL data!
cd /opt/gsd
docker compose down -v
docker system prune -a --volumes
# Then redeploy from Step 5.
```

### GitHub Actions Deployment Fails

**SSH connection failed:** see Section 9 SSH Troubleshooting.

**Docker pull failed:**

```bash
# On server
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker pull ghcr.io/YOUR_ORG/gsd/backend:latest
```

**Health check failed:**

```bash
ssh user@server
docker compose logs backend
docker compose logs frontend
curl http://localhost:8080/health
curl http://localhost:8080/api/health
```

**Migration failed:**

```bash
docker compose exec backend npm run db:migrate:deploy
# If migration breaks: restore from backup, restart old containers,
# investigate.
```

### Rollback

**Automated rollback** is built into the Strategy 2 workflow (`deploy-production.yml`).

**Manual rollback:**

```bash
ssh user@server
cd /opt/gsd

# Pull previous images (if tagged)
docker pull ghcr.io/YOUR_ORG/gsd/backend:previous-tag
docker pull ghcr.io/YOUR_ORG/gsd/frontend:previous-tag

# Or use local images
docker images | grep gsd

docker compose down
docker compose up -d
./scripts/health-check.sh
```

---

## 15. Common Commands

### Docker Compose

```bash
docker compose up -d                       # start
docker compose down                        # stop
docker compose restart                     # restart all
docker compose restart backend             # restart one
docker compose ps                          # status
docker compose logs -f [service]           # logs
docker compose exec backend <command>      # exec
docker compose up -d --build --force-recreate
```

### Database

```bash
docker compose exec backend npm run db:migrate:deploy
docker compose exec postgres psql -U gsd_user -d gsd
./scripts/backup-db.sh
gunzip -c backups/gsd-YYYYMMDD-HHMMSS.sql.gz | \
    docker compose exec -T postgres psql -U gsd_user -d gsd
```

### Maintenance

```bash
./scripts/health-check.sh
./scripts/deploy.sh
docker compose logs -f
docker system df
df -h
docker image prune -a
docker system prune -a
```

---

## 16. File Structure & Checklists

### File Structure

```
/opt/gsd/
├── .env                    # Environment configuration (created by you)
├── .env.example            # Environment template
├── docker-compose.yml      # Main orchestration file
├── docs/
│   └── deployment.md       # This file
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

### Deployment Checklist

**Pre-deployment**

- [ ] Server provisioned with Ubuntu/Debian
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (ports 22, 8080)
- [ ] SSH access configured
- [ ] Google OAuth credentials obtained
- [ ] External reverse proxy forwards to port 8080

**During deployment**

- [ ] Repository cloned to `/opt/gsd`
- [ ] `.env` file created with all values
- [ ] Docker images built successfully
- [ ] All containers started
- [ ] Database migrations completed
- [ ] Health checks passing

**Post-deployment**

- [ ] Application accessible at https://getsd.bieda.it
- [ ] Login with Google OAuth working
- [ ] Database backups configured (cron)
- [ ] Monitoring in place
- [ ] Logs reviewed for errors
- [ ] Credentials backed up securely

### Diagnostic Information for Bug Reports

```bash
uname -a
docker --version
docker compose version

docker compose ps
docker compose logs --tail=100

cat .env | grep -v PASSWORD | grep -v SECRET
```

### Logs Location

- **Application logs:** `docker compose logs`
- **Nginx logs:** `docker compose logs nginx-proxy`
- **Backup logs:** `/var/log/gsd-backup.log` (if using cron)

---

## External Resources

- **Docker Documentation:** https://docs.docker.com/
- **Docker Compose Reference:** https://docs.docker.com/compose/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Google OAuth Setup:** https://console.cloud.google.com/apis/credentials
- **Nginx Documentation:** https://nginx.org/en/docs/

---

## Related Documentation

- `.github/workflows/deploy-production.yml` — Actual workflow implementation
- `docs/docker.md` — Docker build and registry setup
- `docs/local-development.md` — Local dev environment

---

**End of Deployment Guide**
