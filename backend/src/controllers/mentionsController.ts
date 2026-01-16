import { Request, Response } from 'express';
import { Mention } from '../models';
import logger from '../utils/logger';

export const getMentions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { page = 1, pageSize = 20, keyword, sentiment, source, from, to } = req.query;

    const query: Record<string, unknown> = { userId: req.user._id };

    if (keyword) {
      query.keyword = { $regex: new RegExp(keyword as string, 'i') };
    }

    if (sentiment) {
      query.aiSentiment = sentiment;
    }

    if (source) {
      query.source = { $regex: new RegExp(source as string, 'i') };
    }

    if (from || to) {
      query.timestamp = {};
      if (from) (query.timestamp as Record<string, Date>).$gte = new Date(from as string);
      if (to) (query.timestamp as Record<string, Date>).$lte = new Date(to as string);
    }

    const skip = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);
    const limit = parseInt(pageSize as string, 10);

    const [mentions, total] = await Promise.all([
      Mention.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .select('keyword source text url timestamp aiSentiment aiTopics reach engagement'),
      Mention.countDocuments(query),
    ]);

    res.json({
      mentions,
      pagination: {
        page: parseInt(page as string, 10),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + mentions.length < total,
      },
    });
  } catch (error) {
    logger.error('Get mentions error:', error);
    res.status(500).json({ error: 'Failed to get mentions' });
  }
};

export const getMentionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const stats = await Mention.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          positive: { $sum: { $cond: [{ $eq: ['$aiSentiment', 'positive'] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$aiSentiment', 'negative'] }, 1, 0] } },
          neutral: { $sum: { $cond: [{ $eq: ['$aiSentiment', 'neutral'] }, 1, 0] } },
          totalReach: { $sum: { $ifNull: ['$reach', 0] } },
        },
      },
    ]);

    const result = stats[0] || { total: 0, positive: 0, negative: 0, neutral: 0, totalReach: 0 };

    res.json({
      totalMentions: result.total,
      sentiment: {
        positive: result.positive,
        negative: result.negative,
        neutral: result.neutral,
      },
      totalReach: result.totalReach,
    });
  } catch (error) {
    logger.error('Get mention stats error:', error);
    res.status(500).json({ error: 'Failed to get mention stats' });
  }
};
