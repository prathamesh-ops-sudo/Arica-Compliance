import request from 'supertest';
import createTestApp from './app';
import { Mention } from '../src/models';
import mongoose from 'mongoose';

const app = createTestApp();

describe('Analytics API', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'analytics@example.com',
        password: 'Password123',
      });
    token = signupResponse.body.token;
    userId = signupResponse.body.user.id;

    const mentions = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      mentions.push({
        userId: new mongoose.Types.ObjectId(userId),
        keyword: 'technology',
        source: ['Twitter', 'News', 'Reddit'][i % 3],
        text: `Sample mention ${i} about technology`,
        url: `https://example.com/mention/${i}`,
        timestamp: date,
        aiSentiment: ['positive', 'negative', 'neutral'][i % 3],
        aiTopics: ['technology', 'business', 'innovation'].slice(0, (i % 3) + 1),
        reach: Math.floor(Math.random() * 10000),
        engagement: Math.floor(Math.random() * 1000),
      });
    }
    
    await Mention.insertMany(mentions);
  });

  describe('GET /api/analytics/overview', () => {
    it('should return analytics data with default 7d range', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('charts');
      expect(response.body).toHaveProperty('dateRange');
      expect(response.body.summary).toHaveProperty('totalMentions');
      expect(response.body.charts).toHaveProperty('sentimentDistribution');
      expect(response.body.charts).toHaveProperty('mentionTrend');
      expect(response.body.charts).toHaveProperty('topTopics');
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .query({ range: '30d' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalMentions).toBeGreaterThan(0);
    });

    it('should filter by keyword', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .query({ keyword: 'technology' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalMentions).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/overview');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/top-mentions', () => {
    it('should return top mentions', async () => {
      const response = await request(app)
        .get('/api/analytics/top-mentions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mentions');
      expect(Array.isArray(response.body.mentions)).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/analytics/top-mentions')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.mentions.length).toBeLessThanOrEqual(5);
    });

    it('should filter by sentiment', async () => {
      const response = await request(app)
        .get('/api/analytics/top-mentions')
        .query({ sentiment: 'positive' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      response.body.mentions.forEach((mention: { aiSentiment: string }) => {
        expect(mention.aiSentiment).toBe('positive');
      });
    });
  });
});
