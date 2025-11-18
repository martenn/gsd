#!/bin/bash

# Validation script for AI agents
# Ensures all code changes pass linting, typecheck, build, and tests

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to validate a package
validate_package() {
    local package_dir=$1
    local package_name=$2
    local has_tests=${3:-true}
    
    echo ""
    echo "=========================================="
    echo "Validating: $package_name"
    echo "=========================================="
    
    cd "$package_dir" || exit 1
    
    # Linting
    echo "Running lint..."
    if pnpm lint; then
        print_status "Linting passed"
    else
        print_error "Linting failed"
        return 1
    fi
    
    # Type checking
    echo "Running typecheck..."
    if pnpm typecheck; then
        print_status "Type checking passed"
    else
        print_error "Type checking failed"
        return 1
    fi
    
    # Build
    echo "Running build..."
    if pnpm build; then
        print_status "Build passed"
    else
        print_error "Build failed"
        return 1
    fi
    
    # Tests (if applicable)
    if [ "$has_tests" = true ]; then
        echo "Running tests..."
        if pnpm test; then
            print_status "Tests passed"
        else
            print_error "Tests failed"
            return 1
        fi
    fi
    
    cd - > /dev/null || exit 1
    return 0
}

# Main validation
echo "=========================================="
echo "AI Agent Validation Script"
echo "=========================================="
echo ""

# Check if we're in the monorepo root
if [ ! -f "pnpm-workspace.yaml" ]; then
    print_error "Must run from monorepo root"
    exit 1
fi

# Determine what to validate based on arguments
if [ $# -eq 0 ]; then
    # Validate all packages
    print_warning "No package specified, validating all packages..."
    
    # Backend
    if [ -d "apps/backend" ]; then
        validate_package "apps/backend" "Backend" true || exit 1
    fi
    
    # Frontend
    if [ -d "apps/frontend" ]; then
        validate_package "apps/frontend" "Frontend" false || exit 1
    fi
    
    # Types package
    if [ -d "packages/types" ] && [ -f "packages/types/package.json" ]; then
        if grep -q '"lint"' packages/types/package.json; then
            validate_package "packages/types" "Types Package" false || exit 1
        fi
    fi
    
    # Validation package
    if [ -d "packages/validation" ] && [ -f "packages/validation/package.json" ]; then
        if grep -q '"lint"' packages/validation/package.json; then
            validate_package "packages/validation" "Validation Package" false || exit 1
        fi
    fi
else
    # Validate specific package
    case "$1" in
        backend)
            validate_package "apps/backend" "Backend" true || exit 1
            ;;
        frontend)
            validate_package "apps/frontend" "Frontend" false || exit 1
            ;;
        types)
            validate_package "packages/types" "Types Package" false || exit 1
            ;;
        validation)
            validate_package "packages/validation" "Validation Package" false || exit 1
            ;;
        *)
            print_error "Unknown package: $1"
            echo "Usage: $0 [backend|frontend|types|validation]"
            exit 1
            ;;
    esac
fi

echo ""
echo "=========================================="
print_status "All validations passed!"
echo "=========================================="

