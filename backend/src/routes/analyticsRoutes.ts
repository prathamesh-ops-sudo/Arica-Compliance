import { Router } from 'express';
import { getAnalytics, getTopMentions } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/overview', getAnalytics);
router.get('/top-mentions', getTopMentions);

export default router;
