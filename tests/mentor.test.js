'use strict';

const { mentorResponse, getAvailableTopics } = require('../server/engine/mentor');

describe('Mentor Engine', () => {

  describe('mentorResponse()', () => {
    test('returns response for election process question', () => {
      const res = mentorResponse('How does the election process work?', 'beginner');
      expect(res.topic).toBe('election process');
      expect(res.level).toBe('beginner');
      expect(res).toHaveProperty('explanation');
      expect(res).toHaveProperty('steps');
      expect(res).toHaveProperty('real_world_example');
    });

    test('adapts to beginner level with analogies', () => {
      const res = mentorResponse('election process', 'beginner');
      expect(res.explanation.toLowerCase()).toMatch(/like|analogy|class|monitor|choosing/i);
    });

    test('adapts to advanced level with technical terms', () => {
      const res = mentorResponse('election process', 'advanced');
      expect(res.explanation).toMatch(/FPTP|Representation|Act|constituency/i);
    });

    test('handles campaign strategy questions', () => {
      const res = mentorResponse('How should I plan my campaign strategy?', 'intermediate');
      expect(res.topic).toBe('campaign strategy');
    });

    test('handles voting system questions', () => {
      const res = mentorResponse('What is FPTP voting?', 'beginner');
      expect(res.topic).toBe('voting systems');
    });

    test('handles election commission questions', () => {
      const res = mentorResponse('What does the election commission do?', 'beginner');
      expect(res.topic).toBe('election commission');
    });

    test('handles political parties questions', () => {
      const res = mentorResponse('Tell me about BJP and Congress', 'beginner');
      expect(res.topic).toBe('political parties');
    });

    test('returns fallback for unknown questions', () => {
      const res = mentorResponse('quantum computing applications', 'beginner');
      expect(res.topic).toBe('general');
      expect(res).toHaveProperty('available_topics');
    });

    test('defaults to beginner for invalid level', () => {
      const res = mentorResponse('election process', 'expert');
      expect(res.level).toBe('beginner');
    });

    test('includes available topics in response', () => {
      const res = mentorResponse('election process', 'beginner');
      expect(res.available_topics).toBeDefined();
      expect(res.available_topics.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableTopics()', () => {
    test('returns array of topics', () => {
      const topics = getAvailableTopics();
      expect(Array.isArray(topics)).toBe(true);
      expect(topics.length).toBeGreaterThan(0);
      expect(topics).toContain('election process');
      expect(topics).toContain('campaign strategy');
    });
  });
});
