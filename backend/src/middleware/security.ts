import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult, ValidationChain } from 'express-validator';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import logger from '../utils/logger';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

export const mongoSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Sanitized potentially malicious input in ${key}`, {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    });
  },
});

export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  req.requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
};

const skipInTest = (_req: Request, _res: Response, next: NextFunction) => next();

export const strictAuthLimiter = process.env.NODE_ENV === 'test' ? skipInTest : rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts. Please try again in 5 minutes.',
    retryAfter: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      requestId: req.requestId,
      path: req.path,
    });
    res.status(429).json(options.message);
  },
});

export const globalRateLimiter = process.env.NODE_ENV === 'test' ? skipInTest : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

export const apiRateLimiter = process.env.NODE_ENV === 'test' ? skipInTest : rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: 'API rate limit exceeded. Please slow down.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg,
        })),
      });
      return;
    }
    
    next();
  };
};

export const authValidation = {
  signup: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
  ],
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
};

export const keywordValidation = {
  add: [
    body('keyword')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Keyword must be between 2 and 50 characters')
      .matches(/^[a-zA-Z0-9\s\-_]+$/)
      .withMessage('Keyword can only contain letters, numbers, spaces, hyphens, and underscores'),
  ],
};

export const reportValidation = {
  generate: [
    body('range')
      .optional()
      .isIn(['7d', '30d', '90d', 'custom'])
      .withMessage('Invalid date range'),
    body('keywords')
      .optional()
      .isArray()
      .withMessage('Keywords must be an array'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
  ],
};

export const secureJsonParser = (limit: string = '1mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length'], 10);
      const maxSize = parseSize(limit);
      
      if (contentLength > maxSize) {
        res.status(413).json({
          error: 'Payload too large',
          maxSize: limit,
        });
        return;
      }
    }
    next();
  };
};

function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
  if (!match) return 1024 * 1024;
  
  const num = parseInt(match[1], 10);
  const unit = match[2] || 'b';
  
  return num * units[unit];
}

export const securityAuditLog = (action: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    logger.info(`Security audit: ${action}`, {
      requestId: req.requestId,
      action,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method,
      userId: (req as Request & { userId?: string }).userId,
    });
    next();
  };
};

export const preventParameterPollution = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][0];
      }
    }
  }
  next();
};
