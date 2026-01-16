import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from '../src/routes';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
import {
  securityHeaders,
  mongoSanitizer,
  requestIdMiddleware,
} from '../src/middleware/security';

const createTestApp = () => {
  const app = express();

  app.use(requestIdMiddleware);

  app.use(securityHeaders);

  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(mongoSanitizer);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: 'test',
    });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createTestApp;
