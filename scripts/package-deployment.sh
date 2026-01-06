#!/bin/bash

# GSD Deployment Package Builder
# Creates a zip file with all necessary files for manual deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Package info
PACKAGE_NAME="gsd-deployment"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="$PROJECT_ROOT/dist"
TEMP_DIR="$OUTPUT_DIR/${PACKAGE_NAME}-${TIMESTAMP}"
ZIP_FILE="$OUTPUT_DIR/${PACKAGE_NAME}-${TIMESTAMP}.zip"

echo -e "${GREEN}=== GSD Deployment Package Builder ===${NC}"
echo ""
echo "Building deployment package..."
echo "Timestamp: $TIMESTAMP"
echo ""

# Create output and temp directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

# Copy deployment files
echo -e "${YELLOW}Copying deployment files...${NC}"

# Root files
cp "$PROJECT_ROOT/.env.example" "$TEMP_DIR/"
cp "$PROJECT_ROOT/docker-compose.yml" "$TEMP_DIR/"
cp "$PROJECT_ROOT/DEPLOYMENT.md" "$TEMP_DIR/"
cp "$PROJECT_ROOT/README.md" "$TEMP_DIR/" 2>/dev/null || true

# Nginx configuration
mkdir -p "$TEMP_DIR/nginx/conf.d"
cp "$PROJECT_ROOT/nginx/nginx.conf" "$TEMP_DIR/nginx/"
cp "$PROJECT_ROOT/nginx/conf.d/gsd.conf" "$TEMP_DIR/nginx/conf.d/"

# Deployment scripts only (exclude development scripts)
mkdir -p "$TEMP_DIR/scripts"
cp "$PROJECT_ROOT/scripts/setup-env.sh" "$TEMP_DIR/scripts/"
cp "$PROJECT_ROOT/scripts/deploy.sh" "$TEMP_DIR/scripts/"
cp "$PROJECT_ROOT/scripts/backup-db.sh" "$TEMP_DIR/scripts/"
cp "$PROJECT_ROOT/scripts/health-check.sh" "$TEMP_DIR/scripts/"

# Make scripts executable
chmod +x "$TEMP_DIR/scripts"/*.sh

# Deployment documentation
mkdir -p "$TEMP_DIR/.ai"
cp "$PROJECT_ROOT/.ai/deployment-strategies.md" "$TEMP_DIR/.ai/" 2>/dev/null || true

# Create package info file
cat > "$TEMP_DIR/PACKAGE-INFO.txt" << EOF
GSD Deployment Package
======================

Version: 1.0
Built: $TIMESTAMP
Package: ${PACKAGE_NAME}-${TIMESTAMP}.zip

Contents:
---------
- .env.example           Environment configuration template
- docker-compose.yml     Docker orchestration file
- DEPLOYMENT.md          Complete deployment guide
- nginx/                 Nginx reverse proxy configuration
- scripts/               Deployment and maintenance scripts
- .ai/                   Deployment strategy documentation

Deployment Instructions:
------------------------
1. Extract this package on your server to /opt/gsd
2. Follow instructions in DEPLOYMENT.md
3. Run ./scripts/setup-env.sh to configure environment
4. Run docker compose up -d to start services

Quick Start:
-----------
cd /opt/gsd
./scripts/setup-env.sh
docker compose up -d
./scripts/health-check.sh

For detailed instructions, see DEPLOYMENT.md

Note: This package does NOT include application source code.
Docker images are built and pushed via GitHub Actions.
The docker-compose.yml pulls pre-built images from GHCR.
EOF

echo -e "${GREEN}✓${NC} Files copied successfully"
echo ""

# Create zip file
echo -e "${YELLOW}Creating zip archive...${NC}"
cd "$OUTPUT_DIR"
zip -r "$ZIP_FILE" "${PACKAGE_NAME}-${TIMESTAMP}" > /dev/null
echo -e "${GREEN}✓${NC} Archive created successfully"
echo ""

# Clean up temp directory
rm -rf "$TEMP_DIR"

# Show results
FILE_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo -e "${GREEN}=== Package Created Successfully ===${NC}"
echo ""
echo "Package: ${PACKAGE_NAME}-${TIMESTAMP}.zip"
echo "Location: $ZIP_FILE"
echo "Size: $FILE_SIZE"
echo ""
echo "To deploy:"
echo "1. Upload this file to your server"
echo "2. Extract: unzip ${PACKAGE_NAME}-${TIMESTAMP}.zip"
echo "3. Move to deployment location: sudo mv ${PACKAGE_NAME}-${TIMESTAMP} /opt/gsd"
echo "4. Follow DEPLOYMENT.md instructions"
echo ""
echo -e "${GREEN}Done!${NC}"
