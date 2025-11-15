# Docker Hub Setup Guide

This guide walks you through setting up Docker Hub for the GSD project, creating access tokens, and configuring GitHub Actions to push Docker images.

## Table of Contents

1. [Create Docker Hub Account](#1-create-docker-hub-account)
2. [Create Access Token](#2-create-access-token)
3. [Configure GitHub Secrets](#3-configure-github-secrets)
4. [Test the Setup](#4-test-the-setup)
5. [Managing Images](#5-managing-images)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Create Docker Hub Account

### Option A: Personal Account (Recommended for MVP)

1. **Go to Docker Hub**
   - Visit: https://hub.docker.com/signup

2. **Sign Up**
   - Enter your email address
   - Choose a Docker ID (username)
   - Create a strong password
   - Click "Sign Up"

3. **Verify Email**
   - Check your email inbox
   - Click the verification link
   - Return to Docker Hub

4. **Complete Profile** (Optional)
   - Add profile picture
   - Add bio/description
   - Click "Save"

**Free Tier Limits:**
- 1 private repository
- Unlimited public repositories
- 200 container pulls per 6 hours (anonymous users share 100 pulls)

### Option B: Organization Account (For Teams)

1. **Create Personal Account First** (follow steps above)

2. **Create Organization**
   - Click your username (top right) → "Organizations"
   - Click "Create Organization"
   - Enter organization name (e.g., "gsd-app")
   - Choose plan (Free or paid)
   - Click "Create Organization"

3. **Invite Team Members** (Optional)
   - Go to "Members" tab
   - Click "Invite Members"
   - Enter email addresses
   - Assign roles (Owner, Member, Read-Only)

---

## 2. Create Access Token

**Why Access Tokens?**
- More secure than passwords
- Can be scoped to specific permissions
- Can be revoked without changing password
- Required for CI/CD automation

### Steps to Create Access Token

1. **Login to Docker Hub**
   - Go to: https://hub.docker.com/
   - Click "Sign In"
   - Enter your Docker ID and password

2. **Navigate to Security Settings**
   - Click your username (top right)
   - Click "Account Settings"
   - Click "Security" in the left sidebar

3. **Create New Access Token**
   - Click "New Access Token"
   - **Token Description**: Enter a descriptive name
     - Example: `github-actions-gsd-ci`
   - **Access Permissions**: Choose scope
     - **Read, Write, Delete** (recommended for CI/CD)
     - Read-only (if you only need to pull images)
   - Click "Generate"

4. **Copy and Save Token**
   - ⚠️ **IMPORTANT**: Copy the token immediately
   - The token will only be shown once
   - Store it securely (password manager recommended)
   - You cannot retrieve it later

**Example Token:**
```
dckr_pat_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

5. **Click "Copy and Close"**

---

## 3. Configure GitHub Secrets

GitHub Secrets store sensitive credentials securely and make them available to GitHub Actions workflows.

### Steps to Add Secrets

1. **Go to Your GitHub Repository**
   - Example: `https://github.com/martenn/gsd`

2. **Navigate to Settings**
   - Click "Settings" tab (top menu)
   - ⚠️ **Note**: You need admin access to the repository

3. **Go to Secrets and Variables**
   - In left sidebar, expand "Secrets and variables"
   - Click "Actions"

4. **Add DOCKERHUB_USERNAME Secret**
   - Click "New repository secret" (green button)
   - **Name**: `DOCKERHUB_USERNAME`
   - **Value**: Your Docker Hub username (Docker ID)
     - Example: `martenn`
   - Click "Add secret"

5. **Add DOCKERHUB_TOKEN Secret**
   - Click "New repository secret" again
   - **Name**: `DOCKERHUB_TOKEN`
   - **Value**: Paste the access token you copied earlier
     - Example: `dckr_pat_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`
   - Click "Add secret"

6. **Verify Secrets**
   - You should see both secrets listed:
     - `DOCKERHUB_USERNAME` (Updated X ago)
     - `DOCKERHUB_TOKEN` (Updated X ago)
   - ⚠️ **Note**: You cannot view secret values after creation

### Security Best Practices

- ✅ **Use repository secrets** for single-repo access
- ✅ **Use organization secrets** for multi-repo access
- ✅ **Rotate tokens regularly** (every 90 days recommended)
- ✅ **Use minimal permissions** (read-only if possible)
- ✅ **Never commit secrets** to git or expose in logs
- ✅ **Delete unused tokens** from Docker Hub

---

## 4. Test the Setup

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

1. **Go to GitHub Actions**
   - Navigate to your repository
   - Click "Actions" tab

2. **Run Docker Build Workflow**
   - Select "Build Docker Images" workflow
   - Click "Run workflow" button
   - Configure options:
     - **Branch**: `main` or your current branch
     - **Push images to registry**: `true`
     - **Container registry**: `docker.io`
     - **Additional tag**: `test` (optional)
   - Click "Run workflow"

3. **Monitor Workflow Execution**
   - Click on the running workflow
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
   - Go to: https://hub.docker.com/repositories/YOUR_USERNAME
   - You should see:
     - `gsd-backend` repository
     - `gsd-frontend` repository
   - Click repository to view tags and details

---

## 5. Managing Images

### View Your Repositories

1. **Go to Docker Hub Repositories**
   - https://hub.docker.com/repositories/YOUR_USERNAME

2. **Repository Information**
   - **Tags**: All versions/tags of your image
   - **Description**: Auto-populated from README (optional)
   - **Pulls**: Download count
   - **Last Pushed**: Most recent update
   - **Stars**: Community favorites

### Configure Repository Settings

1. **Click on a Repository** (e.g., `gsd-backend`)

2. **General Settings**
   - **Description**: Add overview of the image
   - **Full Description**: Add detailed documentation (supports Markdown)
   - **Visibility**: Public or Private
   - **README**: Link to GitHub README (auto-sync available)

3. **Add README** (Recommended)

   Create a `README.md` in your repository root:

   ```markdown
   # GSD Backend Docker Image

   Production-ready Docker image for GSD (Getting Shit Done) backend API.

   ## Quick Start

   ```bash
   docker pull martenn/gsd-backend:latest
   docker run -p 3000:3000 --env-file .env martenn/gsd-backend:latest
   ```

   ## Environment Variables

   See [.env.example](https://github.com/martenn/gsd/blob/main/apps/backend/.env.example)

   ## Documentation

   - [GitHub Repository](https://github.com/martenn/gsd)
   - [API Documentation](https://api.gsd.example.com/api)
   ```

### Delete Images/Tags

1. **Go to Repository** → **Tags** tab
2. **Select tags** to delete (checkbox)
3. **Click "Delete"** button
4. **Confirm deletion**

⚠️ **Warning**: Deletion is permanent and cannot be undone

### Make Repository Private

1. **Go to Repository** → **Settings** tab
2. **Visibility**: Change from "Public" to "Private"
3. **Click "Save"**

⚠️ **Note**: Free accounts limited to 1 private repository

---

## 6. Troubleshooting

### Issue: "unauthorized: incorrect username or password"

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

### Issue: "denied: requested access to the resource is denied"

**Cause**: Insufficient permissions or repository doesn't exist

**Solution:**
1. Verify repository name matches your Docker Hub username
   - Correct: `docker.io/martenn/gsd-backend`
   - Wrong: `docker.io/gsd/backend` (unless org is named "gsd")
2. Ensure access token has "Read, Write, Delete" permissions
3. Create repository on Docker Hub first (or enable auto-create)

### Issue: "toomanyrequests: You have reached your pull rate limit"

**Cause**: Exceeded 200 pulls per 6 hours (free tier limit)

**Solution:**
1. Wait for rate limit to reset (6 hours)
2. Login to Docker Hub (authenticated users get higher limits)
3. Upgrade to paid plan for unlimited pulls
4. Use GitHub Container Registry (ghcr.io) instead

### Issue: GitHub Actions fails with "Error: Process completed with exit code 1"

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

### Issue: Images are too large

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

### Issue: Security scan fails with vulnerabilities

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

## Quick Reference

### Docker Hub URLs

| Resource | URL |
|----------|-----|
| Sign Up | https://hub.docker.com/signup |
| Login | https://hub.docker.com/ |
| Repositories | https://hub.docker.com/repositories/YOUR_USERNAME |
| Access Tokens | https://hub.docker.com/settings/security |
| Account Settings | https://hub.docker.com/settings/general |

### Docker CLI Commands

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

### GitHub Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `martenn` |
| `DOCKERHUB_TOKEN` | Docker Hub access token | `dckr_pat_abc123...` |

### Workflow Dispatch Options

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `push_images` | boolean | `false` | Push to registry |
| `registry` | choice | `ghcr.io` | Registry to use |
| `tag` | string | - | Custom tag |

---

## Alternative: GitHub Container Registry (ghcr.io)

If you prefer not to use Docker Hub, you can use GitHub Container Registry instead.

### Advantages

- ✅ No separate signup required (uses GitHub account)
- ✅ No pull rate limits
- ✅ Unlimited private repositories
- ✅ Integrated with GitHub (same authentication)
- ✅ No extra configuration needed (uses `GITHUB_TOKEN`)

### Quick Setup

1. **No setup required** - workflow uses `GITHUB_TOKEN` automatically
2. **Run workflow** with `registry=ghcr.io`
3. **Images pushed to**: `ghcr.io/martenn/gsd/backend:latest`

### View Images

- Go to: https://github.com/martenn/gsd/pkgs/container/gsd%2Fbackend
- Or: Your repository → Packages (right sidebar)

---

## Next Steps

After setting up Docker Hub:

1. ✅ Test workflow with `push_images=false` (build only)
2. ✅ Review security scan results
3. ✅ Test workflow with `push_images=true`
4. ✅ Verify images appear on Docker Hub
5. ✅ Pull and test images locally
6. ✅ Document registry URLs for deployment
7. ✅ Set up automated builds (optional)
8. ✅ Configure webhooks for notifications (optional)

---

## Additional Resources

- [Docker Hub Official Docs](https://docs.docker.com/docker-hub/)
- [Access Tokens Documentation](https://docs.docker.com/security/for-developers/access-tokens/)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Last Updated**: 2025-11-15
**Maintainer**: GSD Team
