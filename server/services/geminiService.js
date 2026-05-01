'use strict';

/**
 * @fileoverview Google Gemini AI integration for Electra AI Engine.
 * Provides AI-powered election analysis, smart advice, and educational responses.
 * Uses Google Generative AI SDK with retry logic and graceful fallback.
 * @module services/geminiService
 * @requires @google/generative-ai
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/** @type {GoogleGenerativeAI|null} */
let genAI = null;

/** @type {import('@google/generative-ai').GenerativeModel|null} */
let model = null;

/** @type {Map<string, {data: string, expiry: number}>} */
const responseCache = new Map();

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Initializes the Google Generative AI client.
 * Attempts to connect to the Gemini API with the provided API key.
 * @returns {boolean} True if initialization was successful
 */
function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini] API key not configured. AI features use fallback.');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 512
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    });
    console.log('[Gemini] Google Generative AI initialized (gemini-2.0-flash)');
    return true;
  } catch (error) {
    console.error('[Gemini] Initialization failed:', error.message);
    return false;
  }
}

/**
 * Generates a cache key from input parameters.
 * @param {string} prefix - Cache key prefix
 * @param {Object} params - Parameters to hash
 * @returns {string} Cache key
 */
function getCacheKey(prefix, params) {
  return `${prefix}:${JSON.stringify(params)}`;
}

/**
 * Retrieves cached response if available and not expired.
 * @param {string} key - Cache key
 * @returns {string|null} Cached response or null
 */
function getCached(key) {
  const entry = responseCache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data;
  }
  if (entry) responseCache.delete(key);
  return null;
}

/**
 * Stores a response in cache.
 * @param {string} key - Cache key
 * @param {string} data - Response data
 */
function setCache(key, data) {
  responseCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
  // Evict old entries if cache grows too large
  if (responseCache.size > 100) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
}

/**
 * Calls Gemini API with retry logic.
 * @param {string} prompt - The prompt to send
 * @param {number} [retries=2] - Number of retry attempts
 * @returns {Promise<string|null>} Generated text or null on failure
 */
async function callGeminiWithRetry(prompt, retries = 2) {
  if (!model) return null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      if (text && text.trim().length > 0) return text.trim();
    } catch (error) {
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  return null;
}

/**
 * Generates AI-powered strategic advice for election campaigns.
 * Uses Google Gemini to analyze simulation results and provide actionable recommendations.
 * @param {Object} input - Simulation input parameters
 * @param {string} input.region_type - Region type (urban/rural/mixed)
 * @param {string} input.budget - Budget level
 * @param {string} input.campaign_strategy - Campaign strategy
 * @param {string[]} input.promises - Campaign promises
 * @param {string} input.target_audience - Target audience
 * @param {string} [input.opponent_strength] - Opponent strength
 * @param {Object} result - Simulation result scores
 * @param {Object} analysis - Generated feedback analysis
 * @returns {Promise<string>} Strategic advice text
 */
async function generateSmartAdvice(input, result, analysis) {
  const cacheKey = getCacheKey('advice', { input, result });
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const prompt = buildAdvicePrompt(input, result, analysis);
  const response = await callGeminiWithRetry(prompt);

  if (response) {
    setCache(cacheKey, response);
    return response;
  }
  return getFallbackAdvice(input, result, analysis);
}

/**
 * Builds the prompt for smart advice generation.
 * @param {Object} input - Simulation input
 * @param {Object} result - Simulation result
 * @param {Object} analysis - Feedback analysis
 * @returns {string} Formatted prompt
 */
function buildAdvicePrompt(input, result, analysis) {
  return `You are an expert Indian election strategist. Analyze this election simulation and provide 4 specific, actionable strategic recommendations.

CAMPAIGN DETAILS:
- Region: ${input.region_type} | Budget: ${input.budget}
- Strategy: ${input.campaign_strategy} | Audience: ${input.target_audience}
- Promises: ${input.promises.join(', ')}
- Opponent: ${input.opponent_strength || 'medium'} strength
- Incumbent: ${input.incumbency ? 'Yes' : 'No'} | Coalition: ${input.coalition ? 'Yes' : 'No'}

SCORES:
- Popularity: ${result.popularity_score}/100 | Trust: ${result.trust_score}/100 | Reach: ${result.reach_score}/100
- Vote Share: ${result.vote_share}% | Win Probability: ${result.winning_probability}%
- Result: ${result.result}

WEAKNESSES: ${analysis.weaknesses.join('; ') || 'None major'}

Provide 4 numbered strategic recommendations specific to Indian elections. Keep under 200 words. Be practical and specific.`;
}

/**
 * Generates AI-enhanced educational response using Google Gemini.
 * Adapts explanation complexity based on user's knowledge level.
 * @param {string} question - User's educational question
 * @param {string} userLevel - Knowledge level (beginner/intermediate/advanced)
 * @returns {Promise<string|null>} AI-generated educational content or null
 */
async function generateMentorAI(question, userLevel) {
  if (!model) return null;

  const cacheKey = getCacheKey('mentor', { question: question.toLowerCase(), userLevel });
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const levelGuide = {
    beginner: 'Use simple language with analogies. Target a high school student. Use relatable examples.',
    intermediate: 'Use structured explanations with proper terminology. Target a college student studying political science.',
    advanced: 'Use technical language, cite legal articles, acts, and academic frameworks. Target a political science graduate.'
  };

  const prompt = `You are an expert Indian election and democracy educator.

QUESTION: "${question}"
STUDENT LEVEL: ${userLevel}
INSTRUCTION: ${levelGuide[userLevel] || levelGuide.beginner}

Provide a clear, accurate, and educational answer focused on Indian democracy and elections. Include one specific real-world Indian example. Keep response under 150 words.`;

  const response = await callGeminiWithRetry(prompt);
  if (response) {
    setCache(cacheKey, response);
    return response;
  }
  return null;
}

/**
 * Analyzes campaign strategy effectiveness using Google Gemini.
 * @param {Object} params - Strategy parameters
 * @param {string} params.region_type - Region type
 * @param {string} params.campaign_strategy - Strategy type
 * @param {string} params.target_audience - Target audience
 * @param {string} params.budget - Budget level
 * @param {Object} scores - Computed effectiveness scores
 * @returns {Promise<string|null>} AI analysis or null
 */
async function analyzeStrategyAI(params, scores) {
  if (!model) return null;

  const cacheKey = getCacheKey('strategy', params);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const prompt = `As an Indian election strategy analyst, briefly analyze this campaign approach:

Strategy: ${params.campaign_strategy} in ${params.region_type} region targeting ${params.target_audience} with ${params.budget} budget.
Effectiveness Score: ${scores.effectiveness}%
Region Fit: ${scores.regionFit}% | Audience Fit: ${scores.audienceFit}%

Provide a 2-3 sentence analysis explaining WHY this strategy works or doesn't, with one suggestion. Reference Indian election context. Keep under 80 words.`;

  const response = await callGeminiWithRetry(prompt);
  if (response) {
    setCache(cacheKey, response);
    return response;
  }
  return null;
}

/**
 * Generates AI-powered simulation summary using Google Gemini.
 * @param {Object} input - Simulation input
 * @param {Object} result - Simulation result
 * @returns {Promise<string|null>} AI summary or null
 */
async function generateSimulationSummary(input, result) {
  if (!model) return null;

  const cacheKey = getCacheKey('summary', { input, result });
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const prompt = `Summarize this Indian election simulation result in 2-3 engaging sentences:
Candidate running in ${input.region_type} region, ${input.budget} budget, using ${input.campaign_strategy}, promising ${input.promises.join(', ')} to ${input.target_audience}.
Result: ${result.result} with ${result.winning_probability}% probability and ${result.vote_share}% vote share.
Popularity: ${result.popularity_score}, Trust: ${result.trust_score}, Reach: ${result.reach_score}.
Write as a news-style brief. Keep under 60 words.`;

  const response = await callGeminiWithRetry(prompt);
  if (response) {
    setCache(cacheKey, response);
    return response;
  }
  return null;
}

/**
 * Provides fallback advice when Gemini API is unavailable.
 * @param {Object} input - Simulation input
 * @param {Object} result - Simulation result
 * @param {Object} analysis - Feedback analysis
 * @returns {string} Fallback advice text
 */
function getFallbackAdvice(input, result, analysis) {
  const tips = [];
  if (result.trust_score < 50) {
    tips.push('1. Focus on 2-3 core promises to build credibility with voters.');
  }
  if (result.reach_score < 50) {
    tips.push(`2. Your ${input.campaign_strategy.replace('_', ' ')} strategy has limited reach in ${input.region_type} areas. Consider adjusting.`);
  }
  if (result.popularity_score < 50) {
    tips.push('3. Your promises may not align with target audience priorities. Research voter concerns.');
  }
  if (input.budget === 'low') {
    tips.push('4. Maximize grassroots outreach and social media to compensate for budget constraints.');
  }
  if (!input.coalition) {
    tips.push('5. Consider building coalition partnerships to expand your voter base.');
  }
  if (tips.length === 0) {
    tips.push('Your strategy is well-balanced. Consider building coalitions for an extra edge.');
  }
  return tips.join('\n');
}

/**
 * Checks if Google Gemini AI is available and configured.
 * @returns {boolean} True if Gemini is ready
 */
function isGeminiAvailable() {
  return model !== null;
}

/**
 * Returns current cache statistics.
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  let validEntries = 0;
  const now = Date.now();
  for (const entry of responseCache.values()) {
    if (now < entry.expiry) validEntries++;
  }
  return { total: responseCache.size, valid: validEntries };
}

module.exports = {
  initializeGemini,
  generateSmartAdvice,
  generateMentorAI,
  analyzeStrategyAI,
  generateSimulationSummary,
  isGeminiAvailable,
  getFallbackAdvice,
  getCacheStats
};
