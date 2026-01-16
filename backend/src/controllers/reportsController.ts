import { Request, Response } from 'express';
import { Mention } from '../models';
import logger from '../utils/logger';
import mongoose from 'mongoose';

interface ReportRequest {
  range: '7d' | '30d' | 'custom';
  keywords?: string[];
  from?: string;
  to?: string;
  sections?: string[];
}

export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userId = req.user._id;
    const { range = '7d', keywords, from, to, sections }: ReportRequest = req.body;

    let startDate: Date;
    let endDate = new Date();

    if (range === 'custom' && from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      const days = range === '30d' ? 30 : 7;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    const matchStage: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId.toString()),
      timestamp: { $gte: startDate, $lte: endDate },
    };

    if (keywords && keywords.length > 0) {
      matchStage.keyword = { $in: keywords.map((k) => new RegExp(k, 'i')) };
    }

    const [sentimentStats, dailyTrend, topTopics, topMentions, sourceBreakdown] = await Promise.all([
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
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
            positive: { $sum: { $cond: [{ $eq: ['$aiSentiment', 'positive'] }, 1, 0] } },
            negative: { $sum: { $cond: [{ $eq: ['$aiSentiment', 'negative'] }, 1, 0] } },
            neutral: { $sum: { $cond: [{ $eq: ['$aiSentiment', 'neutral'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Mention.aggregate([
        { $match: matchStage },
        { $unwind: '$aiTopics' },
        { $group: { _id: '$aiTopics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      Mention.find(matchStage)
        .sort({ reach: -1, timestamp: -1 })
        .limit(20)
        .select('keyword source text url timestamp aiSentiment aiTopics reach'),

      Mention.aggregate([
        { $match: matchStage },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const sentimentMap: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
    sentimentStats.forEach((item) => {
      if (item._id) sentimentMap[item._id] = item.count;
    });
    const totalMentions = sentimentMap.positive + sentimentMap.negative + sentimentMap.neutral;

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
        keywords: keywords || req.user.keywords,
        sections: sections || ['summary', 'sentiment', 'trends', 'topics', 'mentions', 'sources'],
      },
      summary: {
        totalMentions,
        positiveCount: sentimentMap.positive,
        negativeCount: sentimentMap.negative,
        neutralCount: sentimentMap.neutral,
        positivePercentage: totalMentions > 0 ? Math.round((sentimentMap.positive / totalMentions) * 100) : 0,
        negativePercentage: totalMentions > 0 ? Math.round((sentimentMap.negative / totalMentions) * 100) : 0,
        neutralPercentage: totalMentions > 0 ? Math.round((sentimentMap.neutral / totalMentions) * 100) : 0,
      },
      charts: {
        sentimentDistribution: {
          labels: ['Positive', 'Negative', 'Neutral'],
          datasets: [{
            data: [sentimentMap.positive, sentimentMap.negative, sentimentMap.neutral],
            backgroundColor: ['#22c55e', '#ef4444', '#eab308'],
          }],
        },
        dailyTrend: {
          labels: dailyTrend.map((d) => d._id),
          datasets: [
            {
              label: 'Total',
              data: dailyTrend.map((d) => d.count),
              borderColor: '#0056D2',
              fill: false,
            },
            {
              label: 'Positive',
              data: dailyTrend.map((d) => d.positive),
              borderColor: '#22c55e',
              fill: false,
            },
            {
              label: 'Negative',
              data: dailyTrend.map((d) => d.negative),
              borderColor: '#ef4444',
              fill: false,
            },
          ],
        },
        topTopics: {
          labels: topTopics.map((t) => t._id),
          datasets: [{
            label: 'Mentions',
            data: topTopics.map((t) => t.count),
            backgroundColor: '#0056D2',
          }],
        },
        sourceBreakdown: {
          labels: sourceBreakdown.map((s) => s._id),
          datasets: [{
            data: sourceBreakdown.map((s) => s.count),
            backgroundColor: ['#0056D2', '#22c55e', '#8b5cf6', '#ef4444', '#eab308', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9', '#e2e8f0'],
          }],
        },
      },
      topMentions: topMentions.map((m) => ({
        keyword: m.keyword,
        source: m.source,
        text: m.text.substring(0, 200) + (m.text.length > 200 ? '...' : ''),
        url: m.url,
        timestamp: m.timestamp,
        sentiment: m.aiSentiment,
        topics: m.aiTopics,
        reach: m.reach,
      })),
      recommendations: generateRecommendations(sentimentMap, totalMentions, topTopics),
    };

    logger.info(`Report generated for user ${userId}`);
    res.json(report);
  } catch (error) {
    logger.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

function generateRecommendations(
  sentiment: Record<string, number>,
  total: number,
  topics: Array<{ _id: string; count: number }>
): string[] {
  const recommendations: string[] = [];

  if (total === 0) {
    recommendations.push('No mentions found in this period. Consider expanding your keyword list or date range.');
    return recommendations;
  }

  const negativeRatio = sentiment.negative / total;
  const positiveRatio = sentiment.positive / total;

  if (negativeRatio > 0.3) {
    recommendations.push('High negative sentiment detected. Review recent mentions for potential PR issues.');
  }

  if (positiveRatio > 0.6) {
    recommendations.push('Strong positive sentiment! Consider amplifying successful messaging.');
  }

  if (topics.length > 0) {
    recommendations.push(`Top trending topic: "${topics[0]._id}" - Consider creating content around this theme.`);
  }

  if (total < 10) {
    recommendations.push('Low mention volume. Consider expanding keyword coverage or monitoring additional sources.');
  }

  return recommendations;
}

export const getReportHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const history = [
      { id: '1', name: 'Weekly Brand Report', date: new Date().toISOString(), format: 'PDF', status: 'completed' },
      { id: '2', name: 'Monthly Analysis', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), format: 'PDF', status: 'completed' },
    ];

    res.json({ history });
  } catch (error) {
    logger.error('Report history error:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
};
