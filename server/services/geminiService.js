'use strict';

/**
 * @fileoverview Google Gemini API integration for AI-powered smart advice.
 * Provides enhanced election analysis using the Gemini generative AI model.
 * @module services/geminiService
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

/**
 * Initializes the Gemini client with API key from environment.
 * @returns {boolean} Whether initialization was successful
 */
function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not set. AI-enhanced features will use fallback logic.');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Google Gemini AI initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error.message);
    return false;
  }
}

/**
 * Generates AI-powered smart advice for election strategy.
 * @param {Object} simulationInput - The simulation input parameters
 * @param {Object} simulationResult - The simulation result scores
 * @param {Object} analysis - The generated feedback analysis
 * @returns {Promise<string>} AI-generated strategic advice
 */
async function generateSmartAdvice(simulationInput, simulationResult, analysis) {
  if (!model) {
    return getFallbackAdvice(simulationInput, simulationResult, analysis);
  }

  const prompt = `You are an expert Indian election strategist and political analyst. Analyze this election simulation result and provide 3-4 actionable, specific strategic recommendations.

Simulation Input:
- Region: ${simulationInput.region_type}
- Budget: ${simulationInput.budget}
- Strategy: ${simulationInput.campaign_strategy}
- Promises: ${simulationInput.promises.join(', ')}
- Target Audience: ${simulationInput.target_audience}
- Opponent: ${simulationInput.opponent_strength || 'medium'} strength

Results:
- Popularity: ${simulationResult.popularity_score}/100
- Trust: ${simulationResult.trust_score}/100
- Reach: ${simulationResult.reach_score}/100
- Vote Share: ${simulationResult.vote_share}%
- Win Probability: ${simulationResult.winning_probability}%
- Outcome: ${simulationResult.result}

Weaknesses identified: ${analysis.weaknesses.join('; ')}

Provide brief, practical advice specific to Indian elections. Keep response under 200 words. Use numbered points.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return getFallbackAdvice(simulationInput, simulationResult, analysis);
  }
}

/**
 * Generates AI-powered mentor response for educational queries.
 * @param {string} question - User's question
 * @param {string} userLevel - beginner/intermediate/advanced
 * @returns {Promise<string>} AI-generated educational response
 */
async function generateMentorAI(question, userLevel) {
  if (!model) return null;

  const levelGuide = {
    beginner: 'Use simple language, analogies, and relatable examples. Target a 10th-grade student.',
    intermediate: 'Use structured explanations with proper terminology. Target a college student.',
    advanced: 'Use technical language, legal references, and academic frameworks. Target a political science graduate.'
  };

  const prompt = `You are an expert Indian election educator. Answer this question about Indian elections/democracy:

Question: "${question}"
Student Level: ${userLevel}
${levelGuide[userLevel] || levelGuide.beginner}

Provide a clear, accurate answer with real Indian examples. Keep response under 150 words. Focus on the Indian context.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini mentor error:', error.message);
    return null;
  }
}

/**
 * Fallback advice when Gemini is unavailable.
 */
function getFallbackAdvice(input, result, analysis) {
  const tips = [];
  if (result.trust_score < 50) tips.push('Focus on 2-3 core promises to build credibility.');
  if (result.reach_score < 50) tips.push(`Consider adjusting your strategy for ${input.region_type} regions.`);
  if (result.popularity_score < 50) tips.push('Your promises may not align with your target audience priorities.');
  if (input.budget === 'low') tips.push('Maximize grassroots outreach to compensate for budget constraints.');
  if (tips.length === 0) tips.push('Your strategy is well-balanced. Consider building coalitions for an extra edge.');
  return tips.join('\n');
}

/** Check if Gemini is available */
function isGeminiAvailable() {
  return model !== null;
}

module.exports = { initializeGemini, generateSmartAdvice, generateMentorAI, isGeminiAvailable, getFallbackAdvice };
