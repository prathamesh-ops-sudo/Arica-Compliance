import { Router, Request, Response } from 'express';
import { getMentions, getMentionStats } from '../controllers/mentionsController';
import { authMiddleware } from '../middleware/auth';
import { pollForUser } from '../services/poller';
import logger from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/', getMentions);
router.get('/stats', getMentionStats);

router.get('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    logger.info(`[API] Manual refresh triggered by user ${req.user.email}`);
    
    const result = await pollForUser(req.user._id.toString());
    
    res.json({
      success: true,
      message: `Poll complete. Added ${result.mentionsAdded} new mentions.`,
      mentionsAdded: result.mentionsAdded,
    });
  } catch (error) {
    logger.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh mentions' });
  }
});

export default router;
