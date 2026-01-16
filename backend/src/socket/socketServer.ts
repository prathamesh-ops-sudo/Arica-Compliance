import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import logger from '../utils/logger';

let io: Server | null = null;

interface JwtPayload {
  userId: string;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }
    return next(new Error('Authentication failed'));
  }
};

export const initializeSocketServer = (httpServer: HttpServer): Server => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const isProduction = process.env.NODE_ENV === 'production';

  // Configure CORS origins based on environment
  const corsOrigins = isProduction 
    ? [frontendUrl] 
    : [frontendUrl, 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('[Socket] Redis adapter connected');
    } catch (error) {
      logger.warn('[Socket] Redis adapter failed, using in-memory adapter:', error);
    }
  } else {
    logger.info('[Socket] No REDIS_URL configured, using in-memory adapter');
  }

  io.use(authenticateSocket as (socket: Socket, next: (err?: Error) => void) => void);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    const userEmail = socket.userEmail;

    if (!userId) {
      socket.disconnect();
      return;
    }

    logger.info(`[Socket] User connected: ${userEmail} (${userId})`);

    socket.join(`user_${userId}`);

    socket.emit('connected', {
      message: 'Connected to AricaInsights real-time updates',
      userId,
      timestamp: new Date().toISOString(),
    });

    socket.on('subscribe', (data: { keywords?: string[] }) => {
      if (data.keywords) {
        data.keywords.forEach((keyword) => {
          socket.join(`keyword_${keyword.toLowerCase()}`);
        });
        logger.info(`[Socket] User ${userId} subscribed to keywords: ${data.keywords.join(', ')}`);
      }
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket] User disconnected: ${userEmail} (${userId}) - ${reason}`);
    });
  });

  logger.info('[Socket] Socket.IO server initialized');
  return io;
};

export const getIO = (): Server | null => {
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): boolean => {
  if (!io) {
    logger.warn('[Socket] Socket.IO not initialized');
    return false;
  }

  io.to(`user_${userId}`).emit(event, data);
  return true;
};

export const emitAnalyticsUpdate = (userId: string, stats: unknown): boolean => {
  return emitToUser(userId, 'analyticsUpdate', {
    type: 'analyticsUpdate',
    data: stats,
    timestamp: new Date().toISOString(),
  });
};

export const emitNewMention = (userId: string, mention: unknown): boolean => {
  return emitToUser(userId, 'newMention', {
    type: 'newMention',
    data: mention,
    timestamp: new Date().toISOString(),
  });
};

export const getConnectedUsers = (): number => {
  if (!io) return 0;
  return io.sockets.sockets.size;
};
