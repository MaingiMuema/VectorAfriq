#!/bin/bash

# Production Rebuild Script
# This script rebuilds the Next.js app with production environment variables

set -e  # Exit on error

echo "=========================================="
echo "Production Rebuild Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Check NEXT_PUBLIC_IMAGE_SERVICE_URL
IMAGE_URL=$(grep NEXT_PUBLIC_IMAGE_SERVICE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$IMAGE_URL" ]; then
    echo -e "${RED}Error: NEXT_PUBLIC_IMAGE_SERVICE_URL not found in .env${NC}"
    exit 1
fi

echo "Current NEXT_PUBLIC_IMAGE_SERVICE_URL: $IMAGE_URL"

if [[ $IMAGE_URL == *"localhost"* ]]; then
    echo -e "${RED}Error: Using localhost URL - this won't work in production!${NC}"
    echo "Please update .env with production URL: https://uat.com.vectorafriqproperties.co.ke"
    exit 1
fi

echo -e "${GREEN}✓ Environment variable looks good${NC}"
echo ""

# Confirm before proceeding
read -p "Proceed with rebuild? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rebuild cancelled"
    exit 0
fi

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Build the application
echo "Building application with production environment..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "PM2 detected. Restart your app with:"
    echo "  pm2 restart your-app-name"
else
    echo "Restart your application to apply changes"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Rebuild Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your application"
echo "2. Clear browser cache (Ctrl+Shift+R)"
echo "3. Test image upload"
echo ""
