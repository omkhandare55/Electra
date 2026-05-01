'use strict';

const geminiService = require('../server/services/geminiService');

describe('Gemini Service', () => {
  beforeEach(() => {
    // Reset cache and initialized state
    process.env.GEMINI_API_KEY = 'test_key';
  });

  test('fallback advice is returned correctly', () => {
    const input = {
      region_type: 'urban',
      campaign_strategy: 'social_media',
      budget: 'low',
      promises: ['education'],
      coalition: false
    };
    const result = { trust_score: 40, reach_score: 40, popularity_score: 40 };
    const analysis = { weaknesses: ['Low trust'] };

    const advice = geminiService.getFallbackAdvice(input, result, analysis);
    expect(advice).toContain('Focus on 2-3 core promises');
    expect(advice).toContain('limited reach');
    expect(advice).toContain('not align with target audience');
    expect(advice).toContain('maximize grassroots');
    expect(advice).toContain('building coalition partnerships');
  });

  test('fallback advice handles positive scores', () => {
    const input = {
      region_type: 'urban',
      campaign_strategy: 'social_media',
      budget: 'high',
      promises: ['education'],
      coalition: true
    };
    const result = { trust_score: 90, reach_score: 90, popularity_score: 90 };
    const analysis = { weaknesses: [] };

    const advice = geminiService.getFallbackAdvice(input, result, analysis);
    expect(advice).toContain('Your strategy is well-balanced');
  });

  test('cache stats return correctly', () => {
    const stats = geminiService.getCacheStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('valid');
  });

  test('initialize with bad key handles gracefully', () => {
    process.env.GEMINI_API_KEY = '';
    const isInit = geminiService.initializeGemini();
    expect(isInit).toBe(false);
    expect(geminiService.isGeminiAvailable()).toBe(false);
  });
});
