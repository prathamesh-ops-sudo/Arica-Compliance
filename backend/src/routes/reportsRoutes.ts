import { Router } from 'express';
import { generateReport, getReportHistory } from '../controllers/reportsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/generate', generateReport);
router.get('/history', getReportHistory);

export default router;
