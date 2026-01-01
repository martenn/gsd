#!/bin/bash
#
# GSD Health Check Script
# Verifies all services are running and healthy
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FAILED=0

echo "========================================="
echo "GSD Health Check"
echo "========================================="
echo ""

cd "$PROJECT_ROOT"

# Check if Docker Compose is running
echo "[1/5] Checking Docker Compose services..."
if ! docker compose ps | grep -q "gsd-"; then
    echo "  ERROR: No GSD containers running"
    echo "  Run: docker compose up -d"
    exit 1
fi
echo "  ✓ Docker Compose services are running"
echo ""

# Check Nginx proxy
echo "[2/5] Checking Nginx reverse proxy..."
if ! curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "  ERROR: Nginx proxy health check failed"
    echo "  Check: docker compose logs nginx-proxy"
    FAILED=1
else
    echo "  ✓ Nginx proxy is healthy"
fi
echo ""

# Check backend
echo "[3/5] Checking backend API..."
if ! curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "  ERROR: Backend health check failed"
    echo "  Check: docker compose logs backend"
    FAILED=1
else
    echo "  ✓ Backend API is healthy"
fi
echo ""

# Check frontend
echo "[4/5] Checking frontend..."
if ! curl -sf http://localhost:8080/ > /dev/null 2>&1; then
    echo "  ERROR: Frontend health check failed"
    echo "  Check: docker compose logs frontend"
    FAILED=1
else
    echo "  ✓ Frontend is healthy"
fi
echo ""

# Check database
echo "[5/5] Checking PostgreSQL database..."
if ! docker compose exec -T postgres pg_isready -U gsd_user -d gsd > /dev/null 2>&1; then
    echo "  ERROR: Database is not ready"
    echo "  Check: docker compose logs postgres"
    FAILED=1
else
    echo "  ✓ Database is healthy"
fi
echo ""

# Summary
echo "========================================="
if [ $FAILED -eq 0 ]; then
    echo "✓ All services are healthy!"
    echo "========================================="
    exit 0
else
    echo "✗ Some services failed health checks"
    echo "========================================="
    echo ""
    echo "Troubleshooting:"
    echo "  - View all logs:     docker compose logs"
    echo "  - View specific log: docker compose logs <service>"
    echo "  - Restart service:   docker compose restart <service>"
    echo "  - Restart all:       docker compose restart"
    echo ""
    exit 1
fi
