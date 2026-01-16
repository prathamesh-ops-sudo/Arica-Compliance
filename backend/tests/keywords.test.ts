import request from 'supertest';
import createTestApp from './app';

const app = createTestApp();

describe('Keywords API', () => {
  let token: string;

  beforeEach(async () => {
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'keywords@example.com',
        password: 'Password123',
      });
    token = signupResponse.body.token;
  });

  describe('GET /api/keywords', () => {
    it('should return empty keywords array for new user', async () => {
      const response = await request(app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('keywords');
      expect(response.body.keywords).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/keywords');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/keywords', () => {
    it('should add a new keyword', async () => {
      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: 'technology' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('keyword', 'technology');
      expect(response.body.keywords).toContain('technology');
    });

    it('should normalize keyword to lowercase', async () => {
      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: 'TECHNOLOGY' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('keyword', 'technology');
    });

    it('should return 400 for empty keyword', async () => {
      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: '' });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate keyword', async () => {
      await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: 'duplicate' });

      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: 'duplicate' });

      expect(response.status).toBe(409);
    });

    it('should enforce max 10 keywords limit', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/keywords')
          .set('Authorization', `Bearer ${token}`)
          .send({ keyword: `keyword${i}` });
      }

      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: 'keyword11' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('10');
    });
  });

  describe('DELETE /api/keywords/:keyword', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: 'deleteme' });
    });

    it('should delete an existing keyword', async () => {
      const response = await request(app)
        .delete('/api/keywords/deleteme')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.keywords).not.toContain('deleteme');
    });

    it('should return 404 for non-existent keyword', async () => {
      const response = await request(app)
        .delete('/api/keywords/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
