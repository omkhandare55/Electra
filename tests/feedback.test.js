'use strict';

const { generateFeedback, findBestStrategy, findBestAudienceStrategy, findTopPromises } = require('../server/engine/feedback');

describe('Feedback Engine', () => {
  const baseInput = {
    region_type: 'urban', budget: 'medium', campaign_strategy: 'social_media',
    promises: ['jobs', 'education'], target_audience: 'youth'
  };

  describe('generateFeedback()', () => {
    test('returns all required fields', () => {
      const result = { popularity_score: 75, trust_score: 70, reach_score: 65, vote_share: 45, winning_probability: 55, result: 'Win' };
      const fb = generateFeedback(baseInput, result);
      expect(fb).toHaveProperty('summary');
      expect(fb).toHaveProperty('strengths');
      expect(fb).toHaveProperty('weaknesses');
      expect(fb).toHaveProperty('improvements');
      expect(Array.isArray(fb.strengths)).toBe(true);
      expect(Array.isArray(fb.weaknesses)).toBe(true);
    });

    test('identifies low budget as weakness', () => {
      const input = { ...baseInput, budget: 'low' };
      const result = { popularity_score: 40, trust_score: 35, reach_score: 30, vote_share: 25, winning_probability: 20, result: 'Lose' };
      const fb = generateFeedback(input, result);
      const hasWeakness = fb.weaknesses.some(w => w.toLowerCase().includes('budget'));
      expect(hasWeakness).toBe(true);
    });

    test('identifies good strategy-region fit as strength', () => {
      const result = { popularity_score: 80, trust_score: 75, reach_score: 85, vote_share: 50, winning_probability: 60, result: 'Win' };
      const fb = generateFeedback(baseInput, result);
      expect(fb.strengths.length).toBeGreaterThan(0);
    });

    test('provides improvements for weak campaigns', () => {
      const input = { ...baseInput, campaign_strategy: 'door_to_door', region_type: 'urban', target_audience: 'youth' };
      const result = { popularity_score: 30, trust_score: 35, reach_score: 25, vote_share: 22, winning_probability: 15, result: 'Lose' };
      const fb = generateFeedback(input, result);
      expect(fb.improvements.length).toBeGreaterThan(0);
    });

    test('flags overpromising', () => {
      const input = { ...baseInput, promises: ['jobs', 'education', 'healthcare', 'infrastructure', 'housing'] };
      const result = { popularity_score: 50, trust_score: 30, reach_score: 50, vote_share: 35, winning_probability: 30, result: 'Lose' };
      const fb = generateFeedback(input, result);
      const hasOverpromise = fb.weaknesses.some(w => w.toLowerCase().includes('promises'));
      expect(hasOverpromise).toBe(true);
    });
  });

  describe('findBestStrategy()', () => {
    test('returns door_to_door for rural', () => {
      expect(findBestStrategy('rural')).toBe('door_to_door');
    });
    test('returns social_media for urban', () => {
      expect(findBestStrategy('urban')).toBe('social_media');
    });
  });

  describe('findBestAudienceStrategy()', () => {
    test('returns social_media for youth', () => {
      expect(findBestAudienceStrategy('youth')).toBe('social_media');
    });
    test('returns door_to_door for farmers', () => {
      expect(findBestAudienceStrategy('farmers')).toBe('door_to_door');
    });
  });

  describe('findTopPromises()', () => {
    test('returns relevant promises for youth', () => {
      const top = findTopPromises('youth', 2);
      expect(top).toContain('jobs');
      expect(top.length).toBe(2);
    });
    test('returns relevant promises for farmers', () => {
      const top = findTopPromises('farmers', 2);
      expect(top).toContain('subsidies');
    });
  });
});
