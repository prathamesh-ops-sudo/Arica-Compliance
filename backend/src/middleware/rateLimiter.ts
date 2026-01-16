import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const skipInTest = (_req: Request, _res: Response, next: NextFunction) => next();

export const generalLimiter = process.env.NODE_ENV === 'test' ? skipInTest : rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

export const authLimiter = process.env.NODE_ENV === 'test' ? skipInTest : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = process.env.NODE_ENV === 'test' ? skipInTest : rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: 'API rate limit exceeded.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = process.env.NODE_ENV === 'test' ? skipInTest : rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'AI processing rate limit exceeded.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
