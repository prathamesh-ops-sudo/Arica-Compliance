import { Request, Response } from 'express';
import { User } from '../models';
import logger from '../utils/logger';

const MAX_KEYWORDS = 10;

export const getKeywords = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({ keywords: req.user.keywords });
  } catch (error) {
    logger.error('Get keywords error:', error);
    res.status(500).json({ error: 'Failed to get keywords' });
  }
};

export const addKeyword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { keyword } = req.body;

    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({ error: 'Keyword is required' });
      return;
    }

    const normalizedKeyword = keyword.trim().toLowerCase();

    if (normalizedKeyword.length < 2 || normalizedKeyword.length > 50) {
      res.status(400).json({ error: 'Keyword must be between 2 and 50 characters' });
      return;
    }

    if (req.user.keywords.length >= MAX_KEYWORDS) {
      res.status(400).json({ error: `Maximum ${MAX_KEYWORDS} keywords allowed` });
      return;
    }

    if (req.user.keywords.includes(normalizedKeyword)) {
      res.status(409).json({ error: 'Keyword already exists' });
      return;
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: { keywords: normalizedKeyword },
    });

    logger.info(`Keyword added for user ${req.user.email}: ${normalizedKeyword}`);

    res.status(201).json({
      message: 'Keyword added',
      keyword: normalizedKeyword,
      keywords: [...req.user.keywords, normalizedKeyword],
    });
  } catch (error) {
    logger.error('Add keyword error:', error);
    res.status(500).json({ error: 'Failed to add keyword' });
  }
};

export const deleteKeyword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { keyword } = req.params;

    if (!keyword) {
      res.status(400).json({ error: 'Keyword is required' });
      return;
    }

    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!req.user.keywords.includes(normalizedKeyword)) {
      res.status(404).json({ error: 'Keyword not found' });
      return;
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { keywords: normalizedKeyword },
    });

    logger.info(`Keyword removed for user ${req.user.email}: ${normalizedKeyword}`);

    res.json({
      message: 'Keyword removed',
      keywords: req.user.keywords.filter((k) => k !== normalizedKeyword),
    });
  } catch (error) {
    logger.error('Delete keyword error:', error);
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
};
