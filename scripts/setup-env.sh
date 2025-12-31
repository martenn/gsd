#!/bin/bash
#
# GSD Environment Setup Script
# Generates secure credentials and creates .env file
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

echo "========================================="
echo "GSD Environment Setup"
echo "========================================="
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "ERROR: .env file already exists at: $ENV_FILE"
    echo ""
    read -p "Do you want to overwrite it? (yes/no): " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
    echo "Backing up existing .env to .env.backup"
    cp "$ENV_FILE" "$ENV_FILE.backup"
fi

# Generate secure passwords
echo "Generating secure credentials..."
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)

# Prompt for configuration
echo ""
echo "Please provide the following information:"
echo ""

read -p "Application URL [https://getsd.bieda.it]: " APP_URL
APP_URL=${APP_URL:-https://getsd.bieda.it}

read -p "Google Client ID: " GOOGLE_CLIENT_ID
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "ERROR: Google Client ID is required"
    exit 1
fi

read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "ERROR: Google Client Secret is required"
    exit 1
fi

read -p "JWT Expiration [7d]: " JWT_EXPIRES_IN
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}

# Create .env file
cat > "$ENV_FILE" <<EOF
# GSD Application Environment Configuration
# Generated on: $(date)

# =============================================================================
# Application URL
# =============================================================================
APP_URL=$APP_URL

# =============================================================================
# Database Configuration
# =============================================================================
DB_PASSWORD=$DB_PASSWORD

# =============================================================================
# JWT Authentication
# =============================================================================
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=$JWT_EXPIRES_IN

# =============================================================================
# Google OAuth Configuration
# =============================================================================
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
EOF

# Secure the file
chmod 600 "$ENV_FILE"

echo ""
echo "========================================="
echo "Environment file created successfully!"
echo "========================================="
echo ""
echo "Location: $ENV_FILE"
echo ""
echo "IMPORTANT: Save these credentials securely!"
echo ""
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret:        $JWT_SECRET"
echo ""
echo "Next steps:"
echo "  1. Review the .env file"
echo "  2. Ensure Google OAuth redirect URI is configured:"
echo "     $APP_URL/api/auth/google/callback"
echo "  3. Run: docker compose up -d"
echo ""
