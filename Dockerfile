# Multi-stage build for AricaInsights (Project Sentinel)
# Frontend: React/Vite in root
# Backend: Express.js in /backend

FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files for frontend
COPY package*.json ./

# Copy backend package files
COPY backend/package*.json ./backend/

# Install all dependencies
RUN npm ci
RUN cd backend && npm ci

# Copy source code
COPY . .

# Build frontend (outputs to /app/dist)
RUN npm run build

# Build backend (outputs to /app/backend/dist)
RUN cd backend && npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy backend built files and dependencies
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./

# Copy frontend build to serve as static files
COPY --from=builder /app/dist ./public

# Create logs directory
RUN mkdir -p logs

# App Runner uses PORT environment variable
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["node", "dist/server.js"]
