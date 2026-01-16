import express, { Request, Response } from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import routes from './routes';
import { initializeSocketServer, getConnectedUsers } from './socket/socketServer';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { startPolling } from './services/poller';
import {
  securityHeaders,
  mongoSanitizer,
  requestIdMiddleware,
  requestLogger,
  globalRateLimiter,
  preventParameterPollution,
  secureJsonParser,
} from './middleware/security';
import logger from './utils/logger';

dotenv.config();

const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Trust proxy for production (behind Nginx/ALB)
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

app.use(requestIdMiddleware);

app.use(securityHeaders);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [FRONTEND_URL] 
    : [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(cookieParser());

app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
  skip: () => process.env.NODE_ENV === 'test',
}));

app.use(secureJsonParser('1mb'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(mongoSanitizer);
app.use(preventParameterPollution);

app.use(requestLogger);
app.use(globalRateLimiter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: APP_VERSION,
    environment: process.env.NODE_ENV || 'development',
    connectedUsers: getConnectedUsers(),
  });
});

app.use('/api', routes);

// Serve static frontend files in production (for App Runner deployment)
if (IS_PRODUCTION) {
  const publicPath = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    
    // Serve index.html for all non-API routes (SPA support)
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.warn('MONGO_URI not configured. Running without database connection.');
    logger.warn('Some features will be limited. Set MONGO_URI in .env to enable full functionality.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB Atlas');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const startServer = async (): Promise<void> => {
  await connectDB();

  initializeSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   AricaInsights Backend API v${APP_VERSION.padEnd(27)}║
║   ─────────────────────────────────────────────────────   ║
║                                                           ║
║   Server running on port ${String(PORT).padEnd(29)}║
║   Frontend URL: ${FRONTEND_URL.padEnd(35)}    ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(36)}   ║
║   WebSocket: Enabled (Socket.IO)                          ║
║   Polling: ${process.env.ENABLE_POLLING !== 'false' ? 'Enabled' : 'Disabled'}                                       ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/auth/signup       - Register new user       ║
║   • POST /api/auth/login        - Authenticate user       ║
║   • GET  /api/auth/me           - Get current user        ║
║   • GET  /api/keywords          - List keywords           ║
║   • POST /api/keywords          - Add keyword             ║
║   • DELETE /api/keywords/:kw    - Remove keyword          ║
║   • GET  /api/mentions          - Get mentions            ║
║   • GET  /api/mentions/refresh  - Trigger manual poll     ║
║   • GET  /api/analytics/overview - Analytics dashboard    ║
║   • POST /api/reports/generate  - Generate report         ║
║   • GET  /health                - Health check            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Start the polling scheduler after server is ready
    startPolling();
  });
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    mongoose.connection.close(false).then(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
