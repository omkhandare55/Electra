/**
 * @fileoverview Scoring constants, weights, and lookup tables for the Electra AI simulation engine.
 * All values are calibrated against real-world Indian election dynamics.
 * @module engine/constants
 */

'use strict';

/** Strategy effectiveness by region type (0-100 scale) */
const STRATEGY_REGION_SCORES = Object.freeze({
  social_media: Object.freeze({ urban: 88, rural: 35, mixed: 62 }),
  rallies:      Object.freeze({ urban: 58, rural: 82, mixed: 70 }),
  door_to_door: Object.freeze({ urban: 45, rural: 92, mixed: 68 }),
  mixed:        Object.freeze({ urban: 74, rural: 76, mixed: 78 })
});

/** Audience receptiveness to each strategy (0-100 scale) */
const AUDIENCE_STRATEGY_FIT = Object.freeze({
  youth:        Object.freeze({ social_media: 95, rallies: 50, door_to_door: 35, mixed: 68 }),
  farmers:      Object.freeze({ social_media: 22, rallies: 82, door_to_door: 92, mixed: 65 }),
  middle_class: Object.freeze({ social_media: 72, rallies: 62, door_to_door: 58, mixed: 70 }),
  women:        Object.freeze({ social_media: 60, rallies: 55, door_to_door: 80, mixed: 68 }),
  seniors:      Object.freeze({ social_media: 18, rallies: 70, door_to_door: 88, mixed: 60 }),
  mixed:        Object.freeze({ social_media: 58, rallies: 68, door_to_door: 65, mixed: 74 })
});

/** Promise relevance by audience (0-100 scale) */
const PROMISE_AUDIENCE_RELEVANCE = Object.freeze({
  education:      Object.freeze({ youth: 90, farmers: 55, middle_class: 80, women: 85, seniors: 40, mixed: 70 }),
  jobs:           Object.freeze({ youth: 95, farmers: 60, middle_class: 85, women: 75, seniors: 30, mixed: 72 }),
  healthcare:     Object.freeze({ youth: 50, farmers: 80, middle_class: 75, women: 88, seniors: 95, mixed: 78 }),
  infrastructure: Object.freeze({ youth: 45, farmers: 85, middle_class: 70, women: 55, seniors: 50, mixed: 65 }),
  subsidies:      Object.freeze({ youth: 30, farmers: 95, middle_class: 50, women: 70, seniors: 60, mixed: 62 }),
  technology:     Object.freeze({ youth: 88, farmers: 25, middle_class: 72, women: 50, seniors: 15, mixed: 55 }),
  housing:        Object.freeze({ youth: 55, farmers: 60, middle_class: 90, women: 85, seniors: 70, mixed: 72 }),
  security:       Object.freeze({ youth: 40, farmers: 50, middle_class: 65, women: 80, seniors: 75, mixed: 62 }),
  environment:    Object.freeze({ youth: 70, farmers: 65, middle_class: 55, women: 60, seniors: 35, mixed: 58 }),
  corruption:     Object.freeze({ youth: 60, farmers: 70, middle_class: 88, women: 65, seniors: 72, mixed: 72 })
});

/** Promise feasibility scores (low budget makes big promises less credible) */
const PROMISE_FEASIBILITY = Object.freeze({
  education:      Object.freeze({ low: 55, medium: 75, high: 90 }),
  jobs:           Object.freeze({ low: 40, medium: 65, high: 85 }),
  healthcare:     Object.freeze({ low: 35, medium: 70, high: 88 }),
  infrastructure: Object.freeze({ low: 25, medium: 60, high: 85 }),
  subsidies:      Object.freeze({ low: 45, medium: 72, high: 90 }),
  technology:     Object.freeze({ low: 30, medium: 65, high: 88 }),
  housing:        Object.freeze({ low: 30, medium: 60, high: 82 }),
  security:       Object.freeze({ low: 50, medium: 70, high: 85 }),
  environment:    Object.freeze({ low: 55, medium: 72, high: 85 }),
  corruption:     Object.freeze({ low: 65, medium: 78, high: 88 })
});

/** Budget multipliers for scoring */
const BUDGET_MULTIPLIERS = Object.freeze({
  low:    0.78,
  medium: 1.0,
  high:   1.18
});

/** Opponent strength impact on winning probability */
const OPPONENT_IMPACT = Object.freeze({
  weak:   0.15,
  medium: 0.30,
  strong: 0.48
});

/** Incumbency advantage bonus */
const INCUMBENCY_BONUS = 8;

/** Coalition advantage bonus */
const COALITION_BONUS = 12;

/** Scoring weights for final calculation */
const SCORE_WEIGHTS = Object.freeze({
  popularity: 0.40,
  trust:      0.30,
  reach:      0.30
});

/** Maximum number of promises before diminishing returns */
const OPTIMAL_PROMISE_COUNT = 3;

/** Penalty per promise beyond optimal count (trust erosion) */
const OVERPROMISE_PENALTY = 5;

/** Region-audience alignment bonuses */
const REGION_AUDIENCE_BONUS = Object.freeze({
  urban:  Object.freeze({ youth: 12, middle_class: 10, women: 5, farmers: -8, seniors: 2, mixed: 4 }),
  rural:  Object.freeze({ farmers: 15, seniors: 8, women: 6, youth: -5, middle_class: -3, mixed: 3 }),
  mixed:  Object.freeze({ youth: 5, farmers: 5, middle_class: 6, women: 5, seniors: 4, mixed: 8 })
});

/** Valid enum values for input validation */
const VALID_VALUES = Object.freeze({
  user_role:          ['candidate', 'voter', 'learner'],
  user_level:         ['beginner', 'intermediate', 'advanced'],
  region_type:        ['urban', 'rural', 'mixed'],
  budget:             ['low', 'medium', 'high'],
  campaign_strategy:  ['social_media', 'rallies', 'door_to_door', 'mixed'],
  target_audience:    ['youth', 'farmers', 'middle_class', 'women', 'seniors', 'mixed'],
  opponent_strength:  ['weak', 'medium', 'strong'],
  promises:           ['education', 'jobs', 'healthcare', 'infrastructure', 'subsidies', 'technology', 'housing', 'security', 'environment', 'corruption']
});

module.exports = {
  STRATEGY_REGION_SCORES,
  AUDIENCE_STRATEGY_FIT,
  PROMISE_AUDIENCE_RELEVANCE,
  PROMISE_FEASIBILITY,
  BUDGET_MULTIPLIERS,
  OPPONENT_IMPACT,
  INCUMBENCY_BONUS,
  COALITION_BONUS,
  SCORE_WEIGHTS,
  OPTIMAL_PROMISE_COUNT,
  OVERPROMISE_PENALTY,
  REGION_AUDIENCE_BONUS,
  VALID_VALUES
};
