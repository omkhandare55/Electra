'use strict';

const {
  simulateElection, calculatePopularity, calculateTrust, calculateReach,
  calculateVoteShare, calculateWinningProbability, calculatePromiseRelevance,
  calculatePromiseFeasibility, calculateOverpromisePenalty, clamp
} = require('../server/engine/simulator');

describe('Simulator Engine', () => {

  describe('clamp()', () => {
    test('clamps values above max', () => { expect(clamp(150)).toBe(100); });
    test('clamps values below min', () => { expect(clamp(-10)).toBe(0); });
    test('returns value within bounds', () => { expect(clamp(50)).toBe(50); });
    test('rounds to nearest integer', () => { expect(clamp(50.7)).toBe(51); });
    test('supports custom bounds', () => { expect(clamp(20, 15, 65)).toBe(20); });
  });

  describe('calculatePromiseRelevance()', () => {
    test('returns high score for relevant promises', () => {
      const score = calculatePromiseRelevance(['jobs', 'education'], 'youth');
      expect(score).toBeGreaterThan(80);
    });
    test('returns low score for irrelevant promises', () => {
      const score = calculatePromiseRelevance(['subsidies', 'infrastructure'], 'youth');
      expect(score).toBeLessThan(50);
    });
    test('handles empty promises', () => {
      expect(calculatePromiseRelevance([], 'youth')).toBe(30);
    });
    test('handles null promises', () => {
      expect(calculatePromiseRelevance(null, 'youth')).toBe(30);
    });
  });

  describe('calculatePromiseFeasibility()', () => {
    test('high budget = high feasibility', () => {
      const score = calculatePromiseFeasibility(['jobs', 'education'], 'high');
      expect(score).toBeGreaterThan(80);
    });
    test('low budget = lower feasibility', () => {
      const score = calculatePromiseFeasibility(['infrastructure', 'healthcare'], 'low');
      expect(score).toBeLessThan(40);
    });
    test('handles empty promises', () => {
      expect(calculatePromiseFeasibility([], 'medium')).toBe(50);
    });
  });

  describe('calculateOverpromisePenalty()', () => {
    test('no penalty for 3 or fewer promises', () => {
      expect(calculateOverpromisePenalty(['jobs', 'education'])).toBe(0);
      expect(calculateOverpromisePenalty(['jobs', 'education', 'healthcare'])).toBe(0);
    });
    test('penalty for 4+ promises', () => {
      expect(calculateOverpromisePenalty(['a', 'b', 'c', 'd'])).toBe(5);
      expect(calculateOverpromisePenalty(['a', 'b', 'c', 'd', 'e'])).toBe(10);
    });
    test('handles null', () => {
      expect(calculateOverpromisePenalty(null)).toBe(0);
    });
  });

  describe('calculatePopularity()', () => {
    test('returns 0-100 range', () => {
      const score = calculatePopularity({
        promises: ['jobs'], target_audience: 'youth',
        campaign_strategy: 'social_media', region_type: 'urban', budget: 'medium'
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
    test('urban youth with social media scores high', () => {
      const score = calculatePopularity({
        promises: ['jobs', 'education'], target_audience: 'youth',
        campaign_strategy: 'social_media', region_type: 'urban', budget: 'high'
      });
      expect(score).toBeGreaterThan(70);
    });
  });

  describe('calculateTrust()', () => {
    test('focused promises build more trust', () => {
      const focused = calculateTrust({ promises: ['jobs'], budget: 'high', incumbency: false });
      const scattered = calculateTrust({
        promises: ['jobs', 'education', 'healthcare', 'infrastructure', 'housing'],
        budget: 'low', incumbency: false
      });
      expect(focused).toBeGreaterThan(scattered);
    });
    test('incumbency adds bonus', () => {
      const base = calculateTrust({ promises: ['jobs'], budget: 'medium', incumbency: false });
      const incumbent = calculateTrust({ promises: ['jobs'], budget: 'medium', incumbency: true });
      expect(incumbent).toBeGreaterThan(base);
    });
  });

  describe('calculateReach()', () => {
    test('door_to_door has high reach in rural', () => {
      const score = calculateReach({
        campaign_strategy: 'door_to_door', region_type: 'rural', budget: 'medium', coalition: false
      });
      expect(score).toBeGreaterThan(80);
    });
    test('coalition adds reach bonus', () => {
      const base = calculateReach({
        campaign_strategy: 'mixed', region_type: 'mixed', budget: 'medium', coalition: false
      });
      const withCoal = calculateReach({
        campaign_strategy: 'mixed', region_type: 'mixed', budget: 'medium', coalition: true
      });
      expect(withCoal).toBeGreaterThan(base);
    });
  });

  describe('calculateVoteShare()', () => {
    test('returns value between 15 and 65', () => {
      expect(calculateVoteShare(100, 100, 100)).toBeLessThanOrEqual(65);
      expect(calculateVoteShare(0, 0, 0)).toBeGreaterThanOrEqual(15);
    });
    test('higher scores = higher vote share', () => {
      const high = calculateVoteShare(90, 85, 80);
      const low = calculateVoteShare(30, 25, 20);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('calculateWinningProbability()', () => {
    test('returns value between 5 and 95', () => {
      const prob = calculateWinningProbability(65, { opponent_strength: 'weak', incumbency: true, coalition: true });
      expect(prob).toBeGreaterThanOrEqual(5);
      expect(prob).toBeLessThanOrEqual(95);
    });
    test('strong opponent reduces probability', () => {
      const weak = calculateWinningProbability(50, { opponent_strength: 'weak', incumbency: false, coalition: false });
      const strong = calculateWinningProbability(50, { opponent_strength: 'strong', incumbency: false, coalition: false });
      expect(weak).toBeGreaterThan(strong);
    });
  });

  describe('simulateElection()', () => {
    const baseInput = {
      user_role: 'candidate', user_level: 'beginner', region_type: 'urban',
      budget: 'medium', campaign_strategy: 'social_media', promises: ['jobs', 'education'],
      target_audience: 'youth', opponent_strength: 'medium', incumbency: false, coalition: false
    };

    test('returns all required fields', () => {
      const result = simulateElection(baseInput);
      expect(result).toHaveProperty('popularity_score');
      expect(result).toHaveProperty('trust_score');
      expect(result).toHaveProperty('reach_score');
      expect(result).toHaveProperty('vote_share');
      expect(result).toHaveProperty('winning_probability');
      expect(result).toHaveProperty('result');
    });

    test('result is Win or Lose', () => {
      const result = simulateElection(baseInput);
      expect(['Win', 'Lose']).toContain(result.result);
    });

    test('all scores are 0-100', () => {
      const result = simulateElection(baseInput);
      for (const key of ['popularity_score', 'trust_score', 'reach_score']) {
        expect(result[key]).toBeGreaterThanOrEqual(0);
        expect(result[key]).toBeLessThanOrEqual(100);
      }
    });

    test('consistent results for same input', () => {
      const r1 = simulateElection(baseInput);
      const r2 = simulateElection(baseInput);
      expect(r1).toEqual(r2);
    });

    test('high budget + good strategy = better outcome', () => {
      const good = simulateElection({ ...baseInput, budget: 'high', coalition: true });
      const bad = simulateElection({ ...baseInput, budget: 'low', campaign_strategy: 'door_to_door' });
      expect(good.winning_probability).toBeGreaterThan(bad.winning_probability);
    });
  });
});
