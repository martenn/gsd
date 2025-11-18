# GitHub Actions Workflows

## Docker Build Workflow

**File:** `docker-build.yml`

**Trigger:** Manual (workflow_dispatch)

### Purpose

Builds production Docker images for GSD backend and frontend applications with security scanning.

### Features

- ✅ **On-demand execution** - Run manually via GitHub Actions UI
- ✅ **Multi-stage builds** - Optimized production images
- ✅ **Security scanning** - Trivy vulnerability scanning with SARIF reports
- ✅ **Optional push** - Build locally or push to registry
- ✅ **Multi-registry support** - GitHub Container Registry (ghcr.io) or Docker Hub
- ✅ **Flexible tagging** - Automatic + custom tags
- ✅ **Build caching** - GitHub Actions cache for faster builds

### How to Run

#### Via GitHub UI

1. Go to **Actions** tab in GitHub repository
2. Select **"Build Docker Images"** workflow
3. Click **"Run workflow"** button
4. Configure options:
   - **Push images to registry**: `true` or `false` (default: `false`)
   - **Container registry**: `ghcr.io` or `docker.io` (default: `ghcr.io`)
   - **Additional tag**: Optional custom tag (e.g., `v1.0.0`)
5. Click **"Run workflow"**

#### Via GitHub CLI

```bash
# Build only (no push)
gh workflow run docker-build.yml

# Build and push to GitHub Container Registry
gh workflow run docker-build.yml \
  -f push_images=true \
  -f registry=ghcr.io

# Build and push to Docker Hub with custom tag
gh workflow run docker-build.yml \
  -f push_images=true \
  -f registry=docker.io \
  -f tag=v1.0.0
```

### Workflow Inputs

| Input         | Type    | Required | Default   | Description                               |
| ------------- | ------- | -------- | --------- | ----------------------------------------- |
| `push_images` | boolean | Yes      | `false`   | Whether to push images to registry        |
| `registry`    | choice  | Yes      | `ghcr.io` | Container registry (ghcr.io or docker.io) |
| `tag`         | string  | No       | -         | Additional custom tag (e.g., v1.0.0)      |

### Image Tags

Images are tagged automatically based on:

- `{branch}-{git-sha}` - e.g., `main-abc123f`
- `{branch}` - e.g., `main`
- `latest` - Only for default branch
- `{custom-tag}` - If provided via input

### Registry Configuration

#### GitHub Container Registry (ghcr.io)

**No setup required** - Uses `GITHUB_TOKEN` automatically.

Images will be pushed to:

- `ghcr.io/{owner}/{repo}/backend:latest`
- `ghcr.io/{owner}/{repo}/frontend:latest`

#### Docker Hub (docker.io)

**Setup required:**

1. Create Docker Hub access token:
   - Go to [Docker Hub](https://hub.docker.com/)
   - Account Settings → Security → New Access Token
   - Copy the token

2. Add secrets to GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add `DOCKERHUB_USERNAME` (your Docker Hub username)
   - Add `DOCKERHUB_TOKEN` (your access token)

Images will be pushed to:

- `docker.io/{username}/{repo}/backend:latest`
- `docker.io/{username}/{repo}/frontend:latest`

### Security Scanning

The workflow includes **Trivy** security scanning:

- Scans for **CRITICAL** and **HIGH** severity vulnerabilities
- Uploads results to **GitHub Security** tab (Code scanning alerts)
- Generates SARIF reports for both backend and frontend images
- Runs on every build (even if not pushing)

View scan results:

1. Go to **Security** tab
2. Click **Code scanning**
3. Filter by `backend-image` or `frontend-image` category

### Build Cache

The workflow uses GitHub Actions cache to speed up builds:

- Cache stores Docker layer data between runs
- Significantly reduces build time (50-80% faster)
- Automatically managed by GitHub

### Build Summary

After each run, check the workflow summary for:

- Image names and tags
- Push status
- Build logs
- Security scan results

### Troubleshooting

#### Build fails: "permission denied"

**Solution:** Check repository permissions allow writing packages

#### Build fails: "authentication required"

**Solution:**

- For ghcr.io: Ensure `GITHUB_TOKEN` has `packages: write` permission
- For docker.io: Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets

#### Security scan fails

**Solution:** Review Trivy output in workflow logs, fix vulnerabilities, rebuild

#### Images not pushed

**Solution:** Verify `push_images` input is set to `true`

### Local Testing

Before running the workflow, test builds locally:

```bash
# Build backend
docker build -t gsd-backend:test -f apps/backend/Dockerfile .

# Build frontend
docker build -t gsd-frontend:test -f apps/frontend/Dockerfile .

# Check sizes
docker images | grep gsd
```

See `DOCKER-BUILD-GUIDE.md` for detailed testing instructions.

### Best Practices

1. **Test locally first** - Always build and test locally before pushing
2. **Start with push_images=false** - Verify builds succeed before pushing
3. **Use custom tags for releases** - Tag stable versions (e.g., `v1.0.0`)
4. **Monitor security scans** - Review and fix vulnerabilities regularly
5. **Check image sizes** - Ensure images meet size targets (<200MB backend, <100MB frontend)

### Future Enhancements

Potential improvements for production:

- [ ] Automatic builds on release tags
- [ ] Multi-architecture builds (ARM64 support)
- [ ] Deployment to staging/production after successful build
- [ ] Slack/Discord notifications on build completion
- [ ] Performance benchmarking of images
- [ ] Automatic PR creation for base image updates
