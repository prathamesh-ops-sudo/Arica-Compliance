import { Router } from 'express';
import { getKeywords, addKeyword, deleteKeyword } from '../controllers/keywordsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getKeywords);
router.post('/', addKeyword);
router.delete('/:keyword', deleteKeyword);

export default router;
