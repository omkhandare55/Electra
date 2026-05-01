'use strict';

const { STRATEGY_REGION_SCORES, AUDIENCE_STRATEGY_FIT, PROMISE_AUDIENCE_RELEVANCE, BUDGET_MULTIPLIERS } = require('./constants');

/**
 * Generates structured AI feedback for simulation results.
 * @param {Object} input - Simulation input parameters
 * @param {Object} result - Simulation result scores
 * @returns {Object} Analysis with summary, strengths, weaknesses, improvements
 */
function generateFeedback(input, result) {
  const strengths = [];
  const weaknesses = [];
  const improvements = [];

  const { region_type, budget, campaign_strategy, promises, target_audience } = input;
  const { popularity_score, trust_score, reach_score, vote_share, winning_probability } = result;

  // --- Analyze Strategy-Region Fit ---
  const strategyFit = STRATEGY_REGION_SCORES[campaign_strategy]?.[region_type] || 50;
  if (strategyFit >= 75) {
    strengths.push(`Your ${campaign_strategy.replace('_', ' ')} strategy is highly effective in ${region_type} regions (${strategyFit}% fit).`);
  } else if (strategyFit < 50) {
    weaknesses.push(`${campaign_strategy.replace('_', ' ')} campaigns have low impact in ${region_type} areas (${strategyFit}% fit).`);
    const bestStrategy = findBestStrategy(region_type);
    improvements.push(`Consider switching to ${bestStrategy.replace('_', ' ')} for better reach in ${region_type} regions.`);
  }

  // --- Analyze Audience-Strategy Fit ---
  const audienceFit = AUDIENCE_STRATEGY_FIT[target_audience]?.[campaign_strategy] || 50;
  if (audienceFit >= 75) {
    strengths.push(`${target_audience} voters respond well to ${campaign_strategy.replace('_', ' ')} campaigns (${audienceFit}% receptiveness).`);
  } else if (audienceFit < 50) {
    weaknesses.push(`${target_audience} voters are not easily reached via ${campaign_strategy.replace('_', ' ')} (${audienceFit}% receptiveness).`);
    const bestAudienceStrat = findBestAudienceStrategy(target_audience);
    improvements.push(`${target_audience} voters respond better to ${bestAudienceStrat.replace('_', ' ')} campaigns.`);
  }

  // --- Analyze Promise Relevance ---
  const avgRelevance = promises.reduce((sum, p) => {
    return sum + (PROMISE_AUDIENCE_RELEVANCE[p]?.[target_audience] || 40);
  }, 0) / promises.length;

  if (avgRelevance >= 75) {
    strengths.push(`Your promises align strongly with ${target_audience} voter priorities (${Math.round(avgRelevance)}% relevance).`);
  } else if (avgRelevance < 55) {
    weaknesses.push(`Your promises have limited appeal to ${target_audience} voters (${Math.round(avgRelevance)}% relevance).`);
    const topPromises = findTopPromises(target_audience, 2);
    improvements.push(`Focus on ${topPromises.join(' and ')} to better connect with ${target_audience} voters.`);
  }

  // --- Analyze Budget ---
  if (budget === 'low') {
    weaknesses.push('Low budget limits campaign reach and reduces credibility for ambitious promises.');
    improvements.push('If budget cannot be increased, focus on high-impact, low-cost strategies like door-to-door canvassing.');
  } else if (budget === 'high') {
    strengths.push('High campaign budget enables broad reach and strengthens promise credibility.');
  }

  // --- Analyze Overpromising ---
  if (promises.length > 4) {
    weaknesses.push(`Making ${promises.length} promises may appear unfocused and reduce voter trust.`);
    improvements.push('Narrow your platform to 2-3 key promises for maximum credibility.');
  } else if (promises.length <= 2) {
    strengths.push('A focused platform with few promises builds strong voter trust.');
  }

  // --- Analyze Scores ---
  if (trust_score < 50) {
    weaknesses.push(`Low trust score (${trust_score}) suggests voters question your ability to deliver.`);
  }
  if (reach_score >= 70) {
    strengths.push(`Strong voter reach (${reach_score}) means your message is getting out effectively.`);
  }

  // --- Generate Summary ---
  let summary;
  if (result.result === 'Win') {
    summary = `Strong campaign performance with ${winning_probability}% winning probability. Your ${campaign_strategy.replace('_', ' ')} strategy in ${region_type} regions targeting ${target_audience} voters is effective. Vote share: ${vote_share}%.`;
  } else {
    summary = `Campaign needs improvement. ${winning_probability}% winning probability with ${vote_share}% vote share. Key areas to address: ${weaknesses.length > 0 ? weaknesses[0].split('.')[0] : 'overall strategy alignment'}.`;
  }

  return { summary, strengths, weaknesses, improvements };
}

function findBestStrategy(regionType) {
  let best = 'mixed'; let bestScore = 0;
  for (const [strat, regions] of Object.entries(STRATEGY_REGION_SCORES)) {
    if (regions[regionType] > bestScore) { bestScore = regions[regionType]; best = strat; }
  }
  return best;
}

function findBestAudienceStrategy(audience) {
  let best = 'mixed'; let bestScore = 0;
  const fits = AUDIENCE_STRATEGY_FIT[audience];
  if (fits) {
    for (const [strat, score] of Object.entries(fits)) {
      if (score > bestScore) { bestScore = score; best = strat; }
    }
  }
  return best;
}

function findTopPromises(audience, count = 2) {
  const scored = [];
  for (const [promise, audiences] of Object.entries(PROMISE_AUDIENCE_RELEVANCE)) {
    scored.push({ promise, score: audiences[audience] || 0 });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.promise);
}

module.exports = { generateFeedback, findBestStrategy, findBestAudienceStrategy, findTopPromises };
