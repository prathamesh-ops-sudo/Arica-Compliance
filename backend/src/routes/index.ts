import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import keywordsRoutes from './keywordsRoutes';
import mentionsRoutes from './mentionsRoutes';
import analyticsRoutes from './analyticsRoutes';
import reportsRoutes from './reportsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/keywords', keywordsRoutes);
router.use('/mentions', mentionsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportsRoutes);

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;
