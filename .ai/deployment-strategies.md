# GitHub Actions Deployment Strategies

**Version:** 1.0
**Last Updated:** 2025-12-31
**Project:** GSD (Getting Shit Done)

---

## Overview

This document outlines various deployment strategies using GitHub Actions, ranging from simple image builds to fully automated continuous deployment pipelines. Each strategy has different trade-offs in terms of automation, safety, and complexity.

---

## Strategy Comparison Table

| Strategy | Automation Level | Safety | Complexity | Best For |
|----------|-----------------|--------|------------|----------|
| **Image-Only Builds** | Low | High | Low | Manual deployment control |
| **Manual Deployment** | Medium | High | Medium | **Recommended for GSD** |
| **Auto-Deploy on Push** | High | Medium | Medium | Mature projects with comprehensive tests |
| **Scheduled Deployments** | High | Medium | Medium | Predictable deployment windows |
| **Watchtower Auto-Pull** | High | Low | Low | Simple setups, risky |
| **Blue-Green Deployment** | High | High | High | Zero-downtime requirements |
| **Environment-Based** | High | High | High | Multi-environment setups |

---

## Strategy 1: Image-Only Builds (Current)

**What it does:**
- Builds Docker images on push
- Pushes images to registry (GHCR or Docker Hub)
- **Does NOT deploy to production**

**Current Implementation:**
- File: `.github/workflows/docker-build.yml`
- Triggered manually via `workflow_dispatch`
- Includes Trivy security scanning

**Pros:**
- Complete manual control over deployments
- Images are pre-built and tested
- No risk of accidental deployments
- Can deploy at your convenience

**Cons:**
- Requires manual SSH to server for deployment
- Two-step process (build → manual deploy)
- No deployment automation

**Best For:**
- Projects in early development
- When you want maximum control
- Testing deployment processes

**How to Use:**
```bash
# 1. Trigger workflow manually on GitHub
# 2. SSH to server and deploy:
ssh user@server
cd /opt/gsd
docker compose pull
docker compose up -d --force-recreate
docker compose exec backend npm run db:migrate:deploy
```

---

## Strategy 2: Manual Deployment with Approvals (RECOMMENDED)

**What it does:**
- Runs tests before deployment
- Builds and pushes images to GHCR
- Deploys to production via SSH
- Automatic rollback on failure
- **Requires manual trigger**

**Implementation:**
- File: `.github/workflows/deploy-production.yml`
- Triggered manually via `workflow_dispatch`
- Option to skip tests (not recommended)

**Workflow:**
```
Manual Trigger → Run Tests → Build Images → Deploy to Server → Health Check
                                    ↓ (if fails)
                                 Rollback
```

**Pros:**
- Fully automated deployment process
- Manual control over when to deploy
- Includes safety checks (tests, health checks, rollback)
- Can skip tests if needed (emergency deployments)
- Clear deployment history in GitHub Actions

**Cons:**
- Requires manual trigger for each deployment
- Needs GitHub Secrets configured

**Best For:**
- **GSD production deployments** (recommended)
- Projects with occasional deployments
- When you want automation with control

**How to Use:**
```bash
# 1. Go to GitHub Actions → Deploy to Production
# 2. Click "Run workflow"
# 3. Select branch (usually main)
# 4. Choose whether to skip tests (default: run tests)
# 5. Click "Run workflow"

# GitHub Actions will:
# - Run tests (if not skipped)
# - Build backend and frontend images
# - Push images to GHCR
# - SSH to your production server
# - Pull new images
# - Restart containers
# - Run database migrations
# - Verify health
# - Rollback if anything fails
```

**Required Secrets:**
```bash
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=your-ssh-user
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_SSH_PORT=22  # optional, defaults to 22
```

---

## Strategy 3: Auto-Deploy on Push to Main

**What it does:**
- Automatically deploys whenever code is pushed to main branch
- Fully automated CI/CD pipeline
- No manual intervention required

**Implementation:**
Modify `.github/workflows/deploy-production.yml`:

```yaml
# Uncomment these lines in deploy-production.yml:
on:
  workflow_dispatch:
    # ... existing inputs
  push:
    branches:
      - main
```

**Workflow:**
```
Push to Main → Run Tests → Build Images → Auto-Deploy → Health Check
                   ↓ (if fails)
               Stop Pipeline
```

**Pros:**
- Zero manual effort for deployments
- Fast feedback loop (code → production quickly)
- Encourages small, frequent deployments

**Cons:**
- **Risky**: Every push to main goes to production
- Requires excellent test coverage
- Can cause frequent production changes
- Harder to control deployment timing

**Best For:**
- Mature projects with comprehensive tests
- Teams practicing continuous deployment
- When you want maximum automation

**Safety Considerations:**
- **Required**: Excellent test coverage (unit + e2e)
- **Required**: Branch protection on main (require PR reviews)
- **Recommended**: Staging environment for pre-production testing
- **Recommended**: Feature flags for incomplete features

**How to Enable:**
1. Ensure tests are comprehensive
2. Set up branch protection on main
3. Uncomment the `push:` section in workflow
4. Push to main → automatic deployment

---

## Strategy 4: Scheduled Deployments

**What it does:**
- Deploys automatically at specific times (e.g., every day at 2 AM)
- Uses cron schedule
- Useful for predictable deployment windows

**Implementation:**
Add to `.github/workflows/deploy-production.yml`:

```yaml
on:
  workflow_dispatch:
    # ... existing inputs
  schedule:
    # Deploy every day at 2:00 AM UTC
    - cron: '0 2 * * *'
```

**Cron Examples:**
```yaml
- cron: '0 2 * * *'      # Daily at 2 AM UTC
- cron: '0 14 * * 1'     # Every Monday at 2 PM UTC
- cron: '0 0 * * 0'      # Every Sunday at midnight UTC
- cron: '0 9 * * 1-5'    # Weekdays at 9 AM UTC
```

**Pros:**
- Predictable deployment times
- Can deploy during low-traffic hours
- Automatic deployment of accumulated changes

**Cons:**
- Deploys even if no changes were made
- Fixed schedule may not match actual needs
- Could deploy broken code if tests pass but logic is wrong

**Best For:**
- Projects with regular release schedules
- Deploying during maintenance windows
- Batching multiple changes

**How to Enable:**
1. Add schedule trigger to workflow
2. Test by temporarily setting schedule to near future
3. Monitor first few scheduled deployments

---

## Strategy 5: Watchtower Auto-Pull

**What it does:**
- Runs a Watchtower container on your server
- Automatically pulls new images from registry
- Restarts containers when new images are available

**Implementation:**
Add to `docker-compose.yml`:

```yaml
services:
  # ... existing services

  watchtower:
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

**Workflow:**
```
Push to Main → Build Images → Push to GHCR
                                    ↓
Server Watchtower (every 5 min) → Check GHCR → Pull New Images → Restart
```

**Pros:**
- Very simple setup
- No GitHub Secrets needed
- Automatic image updates
- Works with any CI system

**Cons:**
- **Dangerous**: No health checks, no rollback
- **Dangerous**: No migration handling
- **Dangerous**: Can break production silently
- No control over deployment timing
- No deployment logs in GitHub

**Best For:**
- Very simple applications without databases
- Development/staging environments
- Learning/hobby projects

**Why NOT Recommended for GSD:**
- Database migrations need manual execution
- No rollback mechanism
- No health verification
- Could cause downtime

---

## Strategy 6: Blue-Green Deployment

**What it does:**
- Maintains two identical environments (Blue and Green)
- Deploys to inactive environment
- Switches traffic only after verification
- Zero-downtime deployments

**Architecture:**
```
Production Traffic → Load Balancer → Blue Environment (v1.0)
                                  ↘ Green Environment (v1.1) [deploying]

After Verification:
Production Traffic → Load Balancer → Blue Environment (v1.0) [idle]
                                  ↘ Green Environment (v1.1) [active]
```

**Implementation:**
Requires:
- Two complete server environments or container sets
- Load balancer (Nginx, HAProxy, or cloud LB)
- Modified docker-compose with environment switching

**Example (simplified):**
```yaml
# docker-compose.yml
services:
  backend-blue:
    # ... blue environment

  backend-green:
    # ... green environment

  load-balancer:
    # Routes to blue or green based on config
```

**Pros:**
- True zero-downtime deployments
- Instant rollback (just switch back)
- Can test production environment before switching
- Safe for high-traffic applications

**Cons:**
- Very complex setup
- Requires double the resources
- Database migrations are tricky (shared DB)
- Overkill for single-user applications

**Best For:**
- High-traffic production applications
- Mission-critical services
- When downtime is unacceptable

**Why NOT Recommended for GSD:**
- Single-user application
- Short deployment downtime is acceptable
- Resource overhead not justified

---

## Strategy 7: Environment-Based Workflows

**What it does:**
- Separate workflows for different environments
- Staging → Production promotion
- Different deployment rules per environment

**Implementation:**
Multiple workflow files:

```
.github/workflows/
├── deploy-staging.yml    # Auto-deploy on push to develop
├── deploy-production.yml # Manual deploy from main
└── promote-to-prod.yml   # Promote staging → production
```

**Example Flow:**
```
Feature Branch → PR → Merge to develop → Auto-deploy to Staging
                                              ↓
                                         Test on Staging
                                              ↓
                                    Manual Promotion to Production
```

**Pros:**
- Test changes in staging before production
- Different rules for different environments
- Safe promotion process
- Matches enterprise workflows

**Cons:**
- Requires multiple servers/environments
- More complex configuration
- Higher infrastructure costs
- Overkill for single-user apps

**Best For:**
- Team projects
- Enterprise applications
- When you need pre-production testing

**Why NOT Recommended for GSD (MVP):**
- Single-user application
- Limited resources
- MVP phase doesn't justify complexity

---

## Recommended Strategy for GSD

### Current Phase: MVP Development

**Use Strategy 2: Manual Deployment with Approvals**

**Why:**
1. **Control**: You decide when to deploy
2. **Safety**: Includes tests, health checks, rollback
3. **Automation**: Deployment process is automated (no manual SSH)
4. **Simplicity**: Single workflow, easy to understand
5. **Cost**: No extra infrastructure needed

**Setup Steps:**

1. **Add GitHub Secrets:**
```bash
# Go to GitHub repo → Settings → Secrets and variables → Actions
# Add these secrets:
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=your-ssh-user
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
PRODUCTION_SSH_PORT=22
```

2. **Test the Workflow:**
```bash
# 1. Make a small change, commit, push to main
# 2. Go to GitHub Actions → Deploy to Production
# 3. Click "Run workflow" → Select main → Run
# 4. Watch the deployment progress
# 5. Verify at https://getsd.bieda.it
```

3. **Deployment Process:**
```bash
# For every deployment:
git push origin main
# Then manually trigger workflow in GitHub UI
```

### Future Phases: Post-MVP

**Consider Strategy 3: Auto-Deploy on Push**

**When to Switch:**
- Test coverage is comprehensive (>80%)
- You're confident in your test suite
- You want faster deployment cycles
- You're comfortable with automatic deployments

**How to Switch:**
```yaml
# In .github/workflows/deploy-production.yml, uncomment:
on:
  workflow_dispatch:
    # ... existing
  push:
    branches:
      - main
```

---

## Deployment Best Practices

Regardless of strategy chosen:

### 1. Always Run Tests Before Deploy
- Unit tests
- Integration tests
- E2E tests (if available)

### 2. Include Health Checks
- Backend API health endpoint
- Frontend availability
- Database connectivity

### 3. Have Rollback Plan
- Automatic rollback on failure
- Manual rollback procedure documented
- Database migration rollback strategy

### 4. Monitor Deployments
- Check deployment logs
- Monitor application logs after deployment
- Verify key functionality

### 5. Database Migrations
- Run migrations before starting new code
- Test migrations in staging first
- Have rollback SQL ready
- Avoid destructive migrations in production

### 6. Secrets Management
- Never commit secrets to git
- Use GitHub Secrets for sensitive data
- Rotate secrets periodically
- Limit secret access

### 7. Deployment Timing
- Deploy during low-traffic periods
- Avoid deployments on Fridays (no weekend support)
- Have time to monitor after deployment
- Communicate deployments to users (if multi-user)

---

## Troubleshooting Deployments

### GitHub Actions Deployment Fails

**SSH Connection Failed:**
```bash
# Check SSH key is correct
ssh -i /path/to/key user@server

# Verify PRODUCTION_SSH_KEY secret is complete
# (including -----BEGIN/END----- lines)
```

**Docker Pull Failed:**
```bash
# On server, login to GHCR manually
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Check image exists
docker pull ghcr.io/YOUR_ORG/gsd/backend:latest
```

**Health Check Failed:**
```bash
# SSH to server
ssh user@server

# Check container logs
docker compose logs backend
docker compose logs frontend

# Manual health check
curl http://localhost:8080/health
curl http://localhost:8080/api/health
```

**Migration Failed:**
```bash
# SSH to server
docker compose exec backend npm run db:migrate:deploy

# If migration breaks, rollback:
# 1. Restore from backup
# 2. Restart old containers
# 3. Investigate migration issue
```

### Rollback Failed

**Manual Rollback:**
```bash
# SSH to server
cd /opt/gsd

# Pull previous images (if tagged)
docker pull ghcr.io/YOUR_ORG/gsd/backend:previous-tag
docker pull ghcr.io/YOUR_ORG/gsd/frontend:previous-tag

# Or restore from local images
docker images | grep gsd

# Restart with old images
docker compose down
docker compose up -d

# Verify
./scripts/health-check.sh
```

---

## Migration Path

### Current State → Recommended Strategy

**Step 1: Configure GitHub Secrets**
```bash
# Add all required secrets to GitHub repo
- PRODUCTION_HOST
- PRODUCTION_USER
- PRODUCTION_SSH_KEY
- PRODUCTION_SSH_PORT (optional)
```

**Step 2: Test Workflow**
```bash
# Make a small change (update README or bump version)
git add .
git commit -m "test: verify deployment workflow"
git push origin main

# Manually trigger workflow in GitHub UI
# Watch deployment process
# Verify deployment succeeded
```

**Step 3: Document Process**
```bash
# Add to team documentation:
# - How to trigger deployments
# - When to deploy
# - What to check after deployment
# - How to rollback
```

**Step 4: Regular Use**
```bash
# For each release:
1. Merge all PRs to main
2. Update version in package.json (optional)
3. Push to main
4. Trigger deployment workflow
5. Monitor deployment
6. Verify in production
7. Monitor for 10-15 minutes
```

### Future: Move to Auto-Deploy (Optional)

**When to Consider:**
- 3+ months of stable deployments
- Comprehensive test coverage
- Confidence in deployment process
- Desire for faster iterations

**How to Migrate:**
```yaml
# 1. Add staging environment first
# 2. Auto-deploy to staging on push to develop
# 3. Test extensively in staging
# 4. Manually promote to production
# 5. After 1+ month, consider auto-deploy to production
```

---

## Summary

**For GSD MVP:**
- ✅ **Use Strategy 2**: Manual Deployment with Approvals (`.github/workflows/deploy-production.yml`)
- ✅ Configure GitHub Secrets
- ✅ Manually trigger deployments via GitHub UI
- ✅ Monitor deployment logs and health checks
- ✅ Keep deployment process simple and safe

**For Future:**
- Consider auto-deploy after project matures
- Add staging environment if team grows
- Implement blue-green if downtime becomes issue

**Don't Use:**
- ❌ Watchtower (too risky for database-backed apps)
- ❌ Blue-green (overkill for single-user MVP)
- ❌ Auto-deploy on push (too early for MVP)

---

## Related Documentation

- [Deployment Guide](../DEPLOYMENT.md) - Complete deployment instructions
- [Deployment Plan](.ai/plans/deployment-plan-custom-port.md) - Architecture and setup
- [GitHub Actions Workflow](../.github/workflows/deploy-production.yml) - Actual workflow implementation

---

**Questions or Issues?**
- Check workflow logs in GitHub Actions tab
- Review deployment troubleshooting section above
- Check server logs: `docker compose logs -f`
- Run health check: `./scripts/health-check.sh`
