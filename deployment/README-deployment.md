# AricaInsights AWS Deployment Guide

This guide covers deploying AricaInsights to AWS using the 'meltwater-replica' resources.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│       S3        │     │   MongoDB Atlas │
│   (CDN + SSL)   │     │  (Frontend)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         ▼                                               │
┌─────────────────┐     ┌─────────────────┐              │
│      ALB        │────▶│      EC2        │◀─────────────┘
│  (Load Balancer)│     │   (Backend)     │
│   + ACM SSL     │     │   + PM2         │
└─────────────────┘     └─────────────────┘
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Node.js 20+ installed locally
3. Access to 'meltwater-replica' AWS resources:
   - EC2 instance
   - S3 bucket
   - CloudFront distribution (optional but recommended)
   - ACM certificate (for HTTPS)

## Environment Variables

### Frontend (.env.production)
```bash
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
```

### Backend (.env)
```bash
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/aricainsights
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-secure-refresh-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=1d
FRONTEND_URL=https://your-cloudfront-url.cloudfront.net
REDIS_URL=redis://your-redis-url:6379  # Optional, for Socket.IO scaling
APP_VERSION=1.0.0
```

## Deployment Steps

### 1. Frontend Deployment (S3 + CloudFront)

```bash
# Set environment variables
export S3_BUCKET=meltwater-replica-frontend
export CLOUDFRONT_DISTRIBUTION_ID=EXXXXXXXXXX
export VITE_API_URL=https://your-backend-url.com
export VITE_SOCKET_URL=https://your-backend-url.com

# Run deployment script
cd deployment
./deploy-frontend.sh
```

The script will:
- Install dependencies
- Build the frontend with production settings
- Upload to S3 with proper cache headers
- Invalidate CloudFront cache

### 2. Backend Deployment (EC2 + PM2)

#### First-time EC2 Setup

SSH into your EC2 instance and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Clone repository
cd /home/ubuntu
git clone https://github.com/prathamesh-ops-sudo/arica-insights-builder.git
cd arica-insights-builder/backend

# Install dependencies
npm ci --production

# Create .env file with production values
nano .env  # Add all required environment variables

# Build TypeScript
npm run build

# Start with PM2
pm2 start ../deployment/ecosystem.config.cjs --env production
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

#### Subsequent Deployments

```bash
# From your local machine
export EC2_HOST=your-ec2-public-ip
export EC2_KEY=/path/to/your-key.pem

cd deployment
./deploy-backend.sh
```

### 3. Nginx Configuration

On the EC2 instance:

```bash
# Copy nginx config
sudo cp /home/ubuntu/arica-insights-builder/deployment/nginx.conf /etc/nginx/sites-available/arica-insights

# Enable the site
sudo ln -s /etc/nginx/sites-available/arica-insights /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. Security Group Configuration

Ensure your EC2 security group allows:
- Port 80 (HTTP) - Inbound from ALB or 0.0.0.0/0
- Port 443 (HTTPS) - If using direct HTTPS
- Port 22 (SSH) - From your IP only

### 5. HTTPS Setup (Recommended)

**Option A: Using Application Load Balancer (ALB) with ACM**
1. Create an ALB in AWS Console
2. Request an ACM certificate for your domain
3. Configure ALB listener on port 443 with ACM certificate
4. Point ALB to EC2 target group on port 80
5. Update FRONTEND_URL in backend .env to use HTTPS

**Option B: Using CloudFront for Backend**
1. Create a CloudFront distribution for the backend
2. Set origin to EC2 public IP or ALB
3. Configure HTTPS with ACM certificate

## Verification

### Health Check
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T...",
  "uptime": 123.456,
  "version": "1.0.0",
  "environment": "production"
}
```

### Frontend
Visit your CloudFront URL and verify:
- Login page loads
- Can create account / login
- Dashboard displays correctly
- Real-time updates work (Socket.IO)

## Monitoring

### PM2 Commands
```bash
pm2 status          # View process status
pm2 logs            # View logs
pm2 monit           # Real-time monitoring
pm2 restart all     # Restart all processes
```

### Log Locations
- PM2 logs: `/home/ubuntu/arica-insights-builder/backend/logs/`
- Nginx access: `/var/log/nginx/arica-insights-access.log`
- Nginx errors: `/var/log/nginx/arica-insights-error.log`

## Troubleshooting

### Backend not starting
```bash
# Check PM2 logs
pm2 logs arica-backend --lines 100

# Check if port is in use
sudo lsof -i :3000

# Verify environment variables
cat /home/ubuntu/arica-insights-builder/backend/.env
```

### WebSocket connection issues
1. Verify Nginx WebSocket configuration
2. Check CORS settings in backend
3. Ensure FRONTEND_URL matches actual frontend URL

### Database connection issues
1. Verify MongoDB Atlas IP whitelist includes EC2 IP
2. Check MONGO_URI format and credentials
3. Test connection: `mongosh "your-connection-string"`

## Rollback

To rollback to a previous version:
```bash
cd /home/ubuntu/arica-insights-builder
git log --oneline -10  # Find previous commit
git checkout <commit-hash>
cd backend && npm ci --production && npm run build
pm2 restart all
```

## Support

For issues, check:
1. PM2 logs: `pm2 logs`
2. Nginx logs: `sudo tail -f /var/log/nginx/arica-insights-error.log`
3. CloudWatch (if configured)
