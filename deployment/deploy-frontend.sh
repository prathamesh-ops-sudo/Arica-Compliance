#!/bin/bash
# AricaInsights Frontend Deployment Script
# Deploys React/Vite frontend to S3 + CloudFront

set -e

# Configuration - Set these environment variables before running
S3_BUCKET="${S3_BUCKET:-}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
VITE_API_URL="${VITE_API_URL:-}"
VITE_SOCKET_URL="${VITE_SOCKET_URL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AricaInsights Frontend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Validate required environment variables
if [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}Error: S3_BUCKET environment variable is required${NC}"
    echo "Usage: S3_BUCKET=your-bucket-name CLOUDFRONT_DISTRIBUTION_ID=XXXXX ./deploy-frontend.sh"
    exit 1
fi

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}Step 2: Building frontend for production...${NC}"
# Set production environment variables
export NODE_ENV=production
if [ -n "$VITE_API_URL" ]; then
    echo "Using API URL: $VITE_API_URL"
fi
if [ -n "$VITE_SOCKET_URL" ]; then
    echo "Using Socket URL: $VITE_SOCKET_URL"
fi

npm run build

echo -e "${YELLOW}Step 3: Uploading to S3...${NC}"
aws s3 sync dist/ "s3://$S3_BUCKET" --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload index.html and JSON files with no-cache
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Upload any JSON files (like manifest) with shorter cache
find dist -name "*.json" -exec aws s3 cp {} "s3://$S3_BUCKET/{}" \
    --cache-control "public, max-age=3600" \;

echo -e "${GREEN}Successfully uploaded to S3 bucket: $S3_BUCKET${NC}"

# Invalidate CloudFront cache if distribution ID is provided
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Step 4: Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*"
    echo -e "${GREEN}CloudFront cache invalidation initiated${NC}"
else
    echo -e "${YELLOW}Skipping CloudFront invalidation (no CLOUDFRONT_DISTRIBUTION_ID provided)${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Frontend deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
