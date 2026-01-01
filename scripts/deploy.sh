#!/bin/bash
#
# GSD Deployment Script
# Builds and deploys the application
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "GSD Deployment"
echo "========================================="
echo ""

cd "$PROJECT_ROOT"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Run: ./scripts/setup-env.sh"
    exit 1
fi

# Load environment
source .env

echo "Deployment Configuration:"
echo "  App URL:     $APP_URL"
echo "  Exposed on:  Port 8080"
echo ""

# Confirm deployment
read -p "Continue with deployment? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Pull latest changes (if git repo)
if [ -d ".git" ]; then
    echo "[1/6] Pulling latest changes from git..."
    git pull origin main || echo "  Warning: Git pull failed or not a git repository"
    echo ""
fi

# Build Docker images
echo "[2/6] Building Docker images..."
docker compose build
echo ""

# Stop old containers
echo "[3/6] Stopping old containers..."
docker compose down
echo ""

# Start new containers
echo "[4/6] Starting new containers..."
docker compose up -d
echo ""

# Wait for services to be healthy
echo "[5/6] Waiting for services to be healthy..."
sleep 10

# Check health
if ! ./scripts/health-check.sh; then
    echo ""
    echo "ERROR: Health check failed after deployment"
    echo "Check logs: docker compose logs"
    exit 1
fi

# Run database migrations
echo "[6/6] Running database migrations..."
docker compose exec -T backend npm run db:migrate:deploy
echo ""

# Final status
echo "========================================="
echo "✓ Deployment completed successfully!"
echo "========================================="
echo ""
echo "Application is running on:"
echo "  Local:    http://localhost:8080"
echo "  External: $APP_URL"
echo ""
echo "Useful commands:"
echo "  View logs:      docker compose logs -f"
echo "  Health check:   ./scripts/health-check.sh"
echo "  Backup DB:      ./scripts/backup-db.sh"
echo "  Stop services:  docker compose down"
echo ""
