import request from 'supertest';
import createTestApp from './app';
import { Mention } from '../src/models';
import mongoose from 'mongoose';

const app = createTestApp();

describe('Reports API', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'reports@example.com',
        password: 'Password123',
      });
    token = signupResponse.body.token;
    userId = signupResponse.body.user.id;

    const mentions = [];
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      mentions.push({
        userId: new mongoose.Types.ObjectId(userId),
        keyword: ['technology', 'business', 'innovation'][i % 3],
        source: ['Twitter', 'News', 'Reddit', 'LinkedIn'][i % 4],
        text: `Sample mention ${i} for report testing`,
        url: `https://example.com/report-mention/${i}`,
        timestamp: date,
        aiSentiment: ['positive', 'negative', 'neutral'][i % 3],
        aiTopics: ['technology', 'business', 'innovation', 'market'].slice(0, (i % 4) + 1),
        reach: Math.floor(Math.random() * 50000),
        engagement: Math.floor(Math.random() * 5000),
      });
    }
    
    await Mention.insertMany(mentions);
  });

  describe('POST /api/reports/generate', () => {
    it('should generate a 7-day report', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ range: '7d' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('charts');
      expect(response.body).toHaveProperty('topMentions');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body.metadata.dateRange).toHaveProperty('from');
      expect(response.body.metadata.dateRange).toHaveProperty('to');
    });

    it('should generate a 30-day report', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ range: '30d' });

      expect(response.status).toBe(200);
      expect(response.body.summary.totalMentions).toBeGreaterThan(0);
    });

    it('should filter by keywords', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          range: '30d',
          keywords: ['technology'],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
    });

    it('should include chart data ready for Chart.js', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ range: '7d' });

      expect(response.status).toBe(200);
      expect(response.body.charts.sentimentDistribution).toHaveProperty('labels');
      expect(response.body.charts.sentimentDistribution).toHaveProperty('datasets');
      expect(response.body.charts.dailyTrend).toHaveProperty('labels');
      expect(response.body.charts.dailyTrend).toHaveProperty('datasets');
      expect(response.body.charts.topTopics).toHaveProperty('labels');
      expect(response.body.charts.topTopics).toHaveProperty('datasets');
    });

    it('should include AI-generated recommendations', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ range: '30d' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .send({ range: '7d' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports/history', () => {
    it('should return report history', async () => {
      const response = await request(app)
        .get('/api/reports/history')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('history');
      expect(Array.isArray(response.body.history)).toBe(true);
    });
  });
});
