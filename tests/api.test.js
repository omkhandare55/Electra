'use strict';

const request = require('supertest');
const app = require('../server/index');

describe('API Endpoints', () => {

  describe('GET /api/health', () => {
    test('returns status ok with all fields', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.engine).toContain('Electra');
      expect(res.body).toHaveProperty('gemini');
      expect(res.body).toHaveProperty('cache');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });

    test('cache stats have correct shape', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.cache).toHaveProperty('total');
      expect(res.body.cache).toHaveProperty('valid');
    });
  });

  describe('POST /api/simulate', () => {
    const validInput = {
      user_role: 'candidate', user_level: 'beginner', region_type: 'urban',
      budget: 'medium', campaign_strategy: 'social_media',
      promises: ['jobs', 'education'], target_audience: 'youth'
    };

    test('returns simulation result with all required fields', async () => {
      const res = await request(app).post('/api/simulate').send(validInput);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('simulation_result');
      expect(res.body).toHaveProperty('analysis');
      expect(res.body).toHaveProperty('gemini_powered');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.simulation_result).toHaveProperty('popularity_score');
      expect(res.body.simulation_result).toHaveProperty('trust_score');
      expect(res.body.simulation_result).toHaveProperty('reach_score');
      expect(res.body.simulation_result).toHaveProperty('vote_share');
      expect(res.body.simulation_result).toHaveProperty('winning_probability');
      expect(res.body.simulation_result).toHaveProperty('result');
    });

    test('analysis contains structured feedback', async () => {
      const res = await request(app).post('/api/simulate').send(validInput);
      expect(res.body.analysis).toHaveProperty('summary');
      expect(res.body.analysis).toHaveProperty('strengths');
      expect(res.body.analysis).toHaveProperty('weaknesses');
      expect(res.body.analysis).toHaveProperty('improvements');
      expect(Array.isArray(res.body.analysis.strengths)).toBe(true);
      expect(Array.isArray(res.body.analysis.weaknesses)).toBe(true);
    });

    test('rejects missing required fields', async () => {
      const res = await request(app).post('/api/simulate').send({ region_type: 'urban' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    test('rejects invalid enum values', async () => {
      const res = await request(app).post('/api/simulate').send({ ...validInput, region_type: 'space' });
      expect(res.status).toBe(400);
    });

    test('rejects invalid promise values', async () => {
      const res = await request(app).post('/api/simulate').send({ ...validInput, promises: ['free_stuff'] });
      expect(res.status).toBe(400);
    });

    test('rejects empty promises array', async () => {
      const res = await request(app).post('/api/simulate').send({ ...validInput, promises: [] });
      expect(res.status).toBe(400);
    });

    test('handles all region types correctly', async () => {
      for (const region of ['urban', 'rural', 'mixed']) {
        const res = await request(app).post('/api/simulate').send({ ...validInput, region_type: region });
        expect(res.status).toBe(200);
        expect(res.body.simulation_result.popularity_score).toBeGreaterThanOrEqual(0);
      }
    });

    test('handles all budget levels', async () => {
      for (const budget of ['low', 'medium', 'high']) {
        const res = await request(app).post('/api/simulate').send({ ...validInput, budget });
        expect(res.status).toBe(200);
      }
    });

    test('handles all campaign strategies', async () => {
      for (const strategy of ['social_media', 'rallies', 'door_to_door', 'mixed']) {
        const res = await request(app).post('/api/simulate').send({ ...validInput, campaign_strategy: strategy });
        expect(res.status).toBe(200);
      }
    });

    test('handles optional boolean parameters', async () => {
      const res = await request(app).post('/api/simulate').send({
        ...validInput, opponent_strength: 'strong', incumbency: true, coalition: true
      });
      expect(res.status).toBe(200);
      expect(['Win', 'Lose']).toContain(res.body.simulation_result.result);
    });

    test('returns consistent results for same input', async () => {
      const r1 = await request(app).post('/api/simulate').send(validInput);
      const r2 = await request(app).post('/api/simulate').send(validInput);
      expect(r1.body.simulation_result.popularity_score).toBe(r2.body.simulation_result.popularity_score);
      expect(r1.body.simulation_result.vote_share).toBe(r2.body.simulation_result.vote_share);
    });
  });

  describe('POST /api/smart-advice', () => {
    test('returns smart advice with Gemini status', async () => {
      const res = await request(app).post('/api/smart-advice').send({
        user_role: 'candidate', region_type: 'urban', budget: 'medium',
        campaign_strategy: 'social_media', promises: ['jobs', 'education'],
        target_audience: 'youth'
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('simulation_result');
      expect(res.body).toHaveProperty('analysis');
      expect(res.body).toHaveProperty('smart_advice');
      expect(res.body).toHaveProperty('gemini_powered');
      expect(typeof res.body.smart_advice).toBe('string');
    });

    test('rejects invalid input', async () => {
      const res = await request(app).post('/api/smart-advice').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/mentor', () => {
    test('returns mentor response with Gemini enhancement', async () => {
      const res = await request(app).post('/api/mentor')
        .send({ question: 'What is the election process?', user_level: 'beginner' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mentor_response');
      expect(res.body).toHaveProperty('gemini_powered');
      expect(res.body.mentor_response).toHaveProperty('topic');
      expect(res.body.mentor_response).toHaveProperty('explanation');
    });

    test('adapts response to different user levels', async () => {
      const beginner = await request(app).post('/api/mentor')
        .send({ question: 'election process', user_level: 'beginner' });
      const advanced = await request(app).post('/api/mentor')
        .send({ question: 'election process', user_level: 'advanced' });
      expect(beginner.body.mentor_response.explanation)
        .not.toBe(advanced.body.mentor_response.explanation);
    });

    test('rejects missing question', async () => {
      const res = await request(app).post('/api/mentor').send({});
      expect(res.status).toBe(400);
    });

    test('rejects too-short question', async () => {
      const res = await request(app).post('/api/mentor').send({ question: 'hi' });
      expect(res.status).toBe(400);
    });

    test('rejects too-long question', async () => {
      const res = await request(app).post('/api/mentor').send({ question: 'a'.repeat(501) });
      expect(res.status).toBe(400);
    });

    test('handles unknown topics with available topics list', async () => {
      const res = await request(app).post('/api/mentor')
        .send({ question: 'quantum physics in black holes' });
      expect(res.status).toBe(200);
      expect(res.body.mentor_response).toHaveProperty('available_topics');
    });
  });

  describe('POST /api/analyze-strategy', () => {
    test('returns strategy analysis with Gemini status', async () => {
      const res = await request(app).post('/api/analyze-strategy').send({
        region_type: 'urban', campaign_strategy: 'social_media',
        target_audience: 'youth', budget: 'high'
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('strategy_effectiveness');
      expect(res.body).toHaveProperty('region_fit');
      expect(res.body).toHaveProperty('audience_fit');
      expect(res.body).toHaveProperty('recommendation');
      expect(res.body).toHaveProperty('gemini_powered');
    });

    test('rejects missing required fields', async () => {
      const res = await request(app).post('/api/analyze-strategy').send({ region_type: 'urban' });
      expect(res.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    test('includes security headers from Helmet', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers).toHaveProperty('x-frame-options');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('sanitizes XSS in input safely', async () => {
      const res = await request(app).post('/api/mentor')
        .send({ question: '<script>alert("xss")</script>What is voting?' });
      expect(res.status).toBe(200);
    });
  });

  describe('Static Files', () => {
    test('serves index.html for root path', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
    });
  });
});
