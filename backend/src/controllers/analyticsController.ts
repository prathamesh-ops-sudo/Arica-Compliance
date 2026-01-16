import { Request, Response } from 'express';
import { Mention } from '../models';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userId = req.user._id;
    const { keyword, from, to, range = '7d' } = req.query;

    let startDate: Date;
    let endDate = new Date();

    if (from && to) {
      startDate = new Date(from as string);
      endDate = new Date(to as string);
    } else {
      const days = range === '30d' ? 30 : range === '90d' ? 90 : 7;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    const matchStage: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId.toString()),
      timestamp: { $gte: startDate, $lte: endDate },
    };

    if (keyword) {
      matchStage.keyword = { $regex: new RegExp(keyword as string, 'i') };
    }

    const [sentimentDistribution, mentionTrend, topTopics, totalStats] = await Promise.all([
      Mention.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$aiSentiment',
            count: { $sum: 1 },
          },
        },
      ]),

      Mention.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
            },
            count: { $sum: 1 },
            positive: {
              $sum: { $cond: [{ $eq: ['$aiSentiment', 'positive'] }, 1, 0] },
            },
            negative: {
              $sum: { $cond: [{ $eq: ['$aiSentiment', 'negative'] }, 1, 0] },
            },
            neutral: {
              $sum: { $cond: [{ $eq: ['$aiSentiment', 'neutral'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Mention.aggregate([
        { $match: matchStage },
        { $unwind: '$aiTopics' },
        {
          $group: {
            _id: '$aiTopics',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      Mention.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalMentions: { $sum: 1 },
            totalReach: { $sum: { $ifNull: ['$reach', 0] } },
            avgEngagement: { $avg: { $ifNull: ['$engagement', 0] } },
          },
        },
      ]),
    ]);

    const sentimentMap: Record<string, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };
    sentimentDistribution.forEach((item) => {
      if (item._id) {
        sentimentMap[item._id] = item.count;
      }
    });

    const total = sentimentMap.positive + sentimentMap.negative + sentimentMap.neutral;

    const sentimentChartData = {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          data: [sentimentMap.positive, sentimentMap.negative, sentimentMap.neutral],
          backgroundColor: ['#22c55e', '#ef4444', '#eab308'],
        },
      ],
    };

    const trendChartData = {
      labels: mentionTrend.map((d) => d._id),
      datasets: [
        {
          label: 'Total Mentions',
          data: mentionTrend.map((d) => d.count),
          borderColor: '#0056D2',
          backgroundColor: 'rgba(0, 86, 210, 0.1)',
          fill: true,
        },
        {
          label: 'Positive',
          data: mentionTrend.map((d) => d.positive),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        {
          label: 'Negative',
          data: mentionTrend.map((d) => d.negative),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
      ],
    };

    const topicsChartData = {
      labels: topTopics.map((t) => t._id),
      datasets: [
        {
          label: 'Mentions',
          data: topTopics.map((t) => t.count),
          backgroundColor: ['#0056D2', '#22c55e', '#8b5cf6', '#ef4444', '#eab308'],
        },
      ],
    };

    const shareOfVoice = {
      labels: ['Your Brand', 'Competitor A', 'Competitor B', 'Competitor C'],
      datasets: [
        {
          data: [total, Math.floor(total * 0.7), Math.floor(total * 0.5), Math.floor(total * 0.3)],
          backgroundColor: ['#0056D2', '#64748b', '#94a3b8', '#cbd5e1'],
        },
      ],
    };

    const stats = totalStats[0] || { totalMentions: 0, totalReach: 0, avgEngagement: 0 };

    res.json({
      summary: {
        totalMentions: stats.totalMentions,
        totalReach: stats.totalReach,
        avgEngagement: Math.round(stats.avgEngagement * 100) / 100,
        positivePercentage: total > 0 ? Math.round((sentimentMap.positive / total) * 100) : 0,
        negativePercentage: total > 0 ? Math.round((sentimentMap.negative / total) * 100) : 0,
        neutralPercentage: total > 0 ? Math.round((sentimentMap.neutral / total) * 100) : 0,
      },
      charts: {
        sentimentDistribution: sentimentChartData,
        mentionTrend: trendChartData,
        topTopics: topicsChartData,
        shareOfVoice,
      },
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    });

    logger.info(`Analytics fetched for user ${userId}`);
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

export const getTopMentions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userId = req.user._id;
    const { limit = 10, sentiment, from, to } = req.query;

    const matchStage: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId.toString()),
    };

    if (from && to) {
      matchStage.timestamp = {
        $gte: new Date(from as string),
        $lte: new Date(to as string),
      };
    }

    if (sentiment) {
      matchStage.aiSentiment = sentiment;
    }

    const mentions = await Mention.find(matchStage)
      .sort({ timestamp: -1, reach: -1 })
      .limit(parseInt(limit as string, 10))
      .select('keyword source text url timestamp aiSentiment aiTopics reach engagement');

    res.json({ mentions });
  } catch (error) {
    logger.error('Top mentions error:', error);
    res.status(500).json({ error: 'Failed to fetch top mentions' });
  }
};
