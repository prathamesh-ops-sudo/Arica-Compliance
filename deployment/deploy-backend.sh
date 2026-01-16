#!/bin/bash
# AricaInsights Backend Deployment Script
# Deploys Node.js/Express backend to EC2 with PM2

set -e

# Configuration
EC2_HOST="${EC2_HOST:-}"
EC2_USER="${EC2_USER:-ubuntu}"
EC2_KEY="${EC2_KEY:-}"
APP_DIR="${APP_DIR:-/home/ubuntu/arica-insights-builder}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AricaInsights Backend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Validate required environment variables
if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}Error: EC2_HOST environment variable is required${NC}"
    echo "Usage: EC2_HOST=your-ec2-ip EC2_KEY=/path/to/key.pem ./deploy-backend.sh"
    exit 1
fi

# Build SSH command
SSH_CMD="ssh"
if [ -n "$EC2_KEY" ]; then
    SSH_CMD="ssh -i $EC2_KEY"
fi

echo -e "${YELLOW}Step 1: Connecting to EC2 and pulling latest code...${NC}"
$SSH_CMD "$EC2_USER@$EC2_HOST" << REMOTE_SCRIPT
set -e
cd $APP_DIR

echo "Pulling latest code..."
git pull origin main

echo "Installing backend dependencies..."
cd backend
npm ci --production

echo "Building TypeScript..."
npm run build

echo "Restarting PM2 process..."
pm2 restart ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production

echo "Saving PM2 process list..."
pm2 save

echo "Backend deployment complete!"
pm2 status
REMOTE_SCRIPT

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backend deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify the backend is running: curl http://$EC2_HOST:3000/health"
echo "2. Check PM2 logs: pm2 logs arica-backend"
