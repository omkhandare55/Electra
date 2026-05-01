'use strict';

const {
  STRATEGY_REGION_SCORES, AUDIENCE_STRATEGY_FIT, PROMISE_AUDIENCE_RELEVANCE,
  PROMISE_FEASIBILITY, BUDGET_MULTIPLIERS, OPPONENT_IMPACT, INCUMBENCY_BONUS,
  COALITION_BONUS, SCORE_WEIGHTS, OPTIMAL_PROMISE_COUNT, OVERPROMISE_PENALTY,
  REGION_AUDIENCE_BONUS
} = require('./constants');

/**
 * Clamps a numerical value between a minimum and maximum bound.
 * @param {number} value - The input value to clamp.
 * @param {number} [min=0] - The minimum bound.
 * @param {number} [max=100] - The maximum bound.
 * @returns {number} The clamped integer value.
 */
function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Calculates the relevance of campaign promises to the target audience.
 * @param {string[]} promises - Array of selected promises.
 * @param {string} targetAudience - The target demographic.
 * @returns {number} Average relevance score (0-100).
 */
function calculatePromiseRelevance(promises, targetAudience) {
  if (!promises || promises.length === 0) return 30;
  const scores = promises.map(p => (PROMISE_AUDIENCE_RELEVANCE[p]?.[targetAudience]) || 40);
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

/**
 * Calculates the feasibility of promises based on the available budget.
 * @param {string[]} promises - Array of selected promises.
 * @param {string} budget - The campaign budget (low/medium/high).
 * @returns {number} Average feasibility score (0-100).
 */
function calculatePromiseFeasibility(promises, budget) {
  if (!promises || promises.length === 0) return 50;
  const scores = promises.map(p => (PROMISE_FEASIBILITY[p]?.[budget]) || 50);
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

/**
 * Calculates penalty for selecting too many promises (overpromising).
 * @param {string[]} promises - Array of selected promises.
 * @returns {number} The penalty value to subtract from trust score.
 */
function calculateOverpromisePenalty(promises) {
  if (!promises) return 0;
  return Math.max(0, promises.length - OPTIMAL_PROMISE_COUNT) * OVERPROMISE_PENALTY;
}

/**
 * Calculates the base popularity score.
 * @param {Object} input - Simulation parameters.
 * @returns {number} The popularity score (0-100).
 */
function calculatePopularity(input) {
  const { promises, target_audience, campaign_strategy, region_type, budget } = input;
  const promiseRelevance = calculatePromiseRelevance(promises, target_audience);
  const audienceFit = AUDIENCE_STRATEGY_FIT[target_audience]?.[campaign_strategy] || 50;
  const regionBonus = REGION_AUDIENCE_BONUS[region_type]?.[target_audience] || 0;
  const budgetMult = BUDGET_MULTIPLIERS[budget] || 1.0;
  return clamp((promiseRelevance * 0.55 + audienceFit * 0.45 + regionBonus) * budgetMult);
}

/**
 * Calculates the trust score based on feasibility and incumbency.
 * @param {Object} input - Simulation parameters.
 * @returns {number} The trust score (0-100).
 */
function calculateTrust(input) {
  const { promises, budget, incumbency } = input;
  const feasibility = calculatePromiseFeasibility(promises, budget);
  const penalty = calculateOverpromisePenalty(promises);
  const incBonus = incumbency ? INCUMBENCY_BONUS : 0;
  const budgetCred = budget === 'high' ? 8 : budget === 'medium' ? 4 : -2;
  const focusBonus = promises.length <= 2 ? 6 : promises.length <= 3 ? 3 : 0;
  return clamp(feasibility + budgetCred + focusBonus - penalty + incBonus);
}

/**
 * Calculates the reach score based on strategy and region fit.
 * @param {Object} input - Simulation parameters.
 * @returns {number} The reach score (0-100).
 */
function calculateReach(input) {
  const { campaign_strategy, region_type, budget, coalition } = input;
  const fit = STRATEGY_REGION_SCORES[campaign_strategy]?.[region_type] || 50;
  const budgetMult = BUDGET_MULTIPLIERS[budget] || 1.0;
  const coalBonus = coalition ? COALITION_BONUS : 0;
  return clamp(fit * budgetMult + coalBonus);
}

/**
 * Calculates the overall vote share based on the three core scores.
 * @param {number} popularity - The popularity score.
 * @param {number} trust - The trust score.
 * @param {number} reach - The reach score.
 * @returns {number} The projected vote share (15-65).
 */
function calculateVoteShare(popularity, trust, reach) {
  const weighted = popularity * SCORE_WEIGHTS.popularity + trust * SCORE_WEIGHTS.trust + reach * SCORE_WEIGHTS.reach;
  return clamp(Math.round((15 + (weighted / 100) * 50) * 10) / 10, 15, 65);
}

/**
 * Calculates the winning probability based on vote share and opponents.
 * @param {number} voteShare - The projected vote share.
 * @param {Object} input - Simulation parameters.
 * @returns {number} The winning probability (5-95).
 */
function calculateWinningProbability(voteShare, input) {
  const { opponent_strength, incumbency, coalition } = input;
  const oppPenalty = OPPONENT_IMPACT[opponent_strength] || 0.30;
  const incBonus = incumbency ? 5 : 0;
  const coalBonus = coalition ? 7 : 0;
  let prob = (voteShare - 15) * 2 + incBonus + coalBonus;
  prob = prob * (1 - oppPenalty);
  return clamp(Math.round(prob * 10) / 10, 5, 95);
}

/**
 * Orchestrates the full election simulation.
 * @param {Object} input - Simulation input parameters.
 * @returns {Object} Complete simulation results (scores, vote share, probability, result string).
 */
function simulateElection(input) {
  const popularity = calculatePopularity(input);
  const trust = calculateTrust(input);
  const reach = calculateReach(input);
  const voteShare = calculateVoteShare(popularity, trust, reach);
  const winningProbability = calculateWinningProbability(voteShare, input);
  return {
    popularity_score: popularity,
    trust_score: trust,
    reach_score: reach,
    vote_share: voteShare,
    winning_probability: winningProbability,
    result: winningProbability >= 50 ? 'Win' : 'Lose'
  };
}

module.exports = {
  simulateElection, calculatePopularity, calculateTrust, calculateReach,
  calculateVoteShare, calculateWinningProbability, calculatePromiseRelevance,
  calculatePromiseFeasibility, calculateOverpromisePenalty, clamp
};
