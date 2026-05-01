/**
 * @fileoverview Electra AI Engine — Express server with full Google Gemini integration,
 * security middleware, input validation, and comprehensive API endpoints.
 * @module server/index
 * @requires express
 * @requires cors
 * @requires helmet
 * @requires express-rate-limit
 * @requires dotenv
 */

'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Engine modules
const { simulateElection } = require('./engine/simulator');
const { generateFeedback } = require('./engine/feedback');
const { mentorResponse } = require('./engine/mentor');

// Middleware modules
const { validateSimulationInput, validateMentorInput } = require('./middleware/validator');
const { sanitizeMiddleware } = require('./middleware/sanitizer');

// Google Services
const {
  initializeGemini,
  generateSmartAdvice,
  generateMentorAI,
  analyzeStrategyAI,
  generateSimulationSummary,
  isGeminiAvailable,
  getCacheStats
} = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security Middleware ───────────────────────────────────────

/** Helmet security headers with CSP configured for our frontend */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

/** CORS configuration with allowed origins from environment */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

/** Parse JSON with size limit to prevent payload attacks */
app.use(express.json({ limit: '10kb' }));

/** Sanitize all incoming request bodies */
app.use(sanitizeMiddleware);

/** Rate limiting: 100 requests per 15 minutes per IP */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' }
});
app.use('/api/', apiLimiter);

/** Serve static frontend files */
app.use(express.static(path.join(__dirname, '..', 'public')));

/** Initialize Google Gemini AI on startup */
const geminiReady = initializeGemini();

// ─── Request Logging Middleware ────────────────────────────────

/**
 * Logs API requests with method, path, and response time.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
app.use('/api/', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.path} — ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── API Routes ────────────────────────────────────────────────

/**
 * @route GET /api/health
 * @description Health check endpoint. Returns server status and Google Gemini availability.
 * @returns {Object} Health status with Gemini state and cache stats
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Electra AI v1.0',
    gemini: isGeminiAvailable(),
    cache: getCacheStats(),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * @route POST /api/simulate
 * @description Main election simulation endpoint with Google Gemini AI-generated summary.
 * Runs the deterministic simulation engine and enhances results with Gemini insights.
 * @param {Object} req.body - Simulation input parameters
 * @returns {Object} Simulation results with AI-enhanced summary
 */
app.post('/api/simulate', validateSimulationInput, async (req, res) => {
  try {
    const input = buildSimulationInput(req.body);

    // Run deterministic simulation engine
    const result = simulateElection(input);
    const analysis = generateFeedback(input, result);

    // Enhance with Google Gemini AI summary
    let aiSummary = null;
    try {
      aiSummary = await generateSimulationSummary(input, result);
    } catch (geminiError) {
      console.warn('[Gemini] Summary generation failed:', geminiError.message);
    }

    res.json({
      simulation_result: result,
      analysis: aiSummary ? { ...analysis, ai_summary: aiSummary } : analysis,
      mentor_response: null,
      gemini_powered: isGeminiAvailable(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Simulation error:', error.message);
    res.status(500).json({ error: 'Simulation engine encountered an error.' });
  }
});

/**
 * @route POST /api/smart-advice
 * @description AI-powered strategic advice endpoint using Google Gemini.
 * Provides detailed, actionable campaign recommendations based on simulation results.
 * @param {Object} req.body - Simulation input parameters
 * @returns {Object} Simulation results with Gemini-powered strategic advice
 */
app.post('/api/smart-advice', validateSimulationInput, async (req, res) => {
  try {
    const input = buildSimulationInput(req.body);

    // Run simulation
    const result = simulateElection(input);
    const analysis = generateFeedback(input, result);

    // Generate AI advice using Google Gemini
    const smartAdvice = await generateSmartAdvice(input, result, analysis);

    res.json({
      simulation_result: result,
      analysis,
      smart_advice: smartAdvice,
      gemini_powered: isGeminiAvailable(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Smart advice error:', error.message);
    res.status(500).json({ error: 'Smart advice engine encountered an error.' });
  }
});

/**
 * @route POST /api/mentor
 * @description Educational Q&A endpoint with Google Gemini AI enhancement.
 * Combines knowledge base responses with Gemini-generated insights adapted to user level.
 * @param {Object} req.body - Question and user level
 * @returns {Object} Knowledge base response plus Gemini AI insight
 */
app.post('/api/mentor', validateMentorInput, async (req, res) => {
  try {
    const { question, user_level } = req.body;
    const level = user_level || 'beginner';

    // Get knowledge base response
    const baseResponse = mentorResponse(question, level);

    // Enhance with Google Gemini AI
    let aiInsight = null;
    try {
      aiInsight = await generateMentorAI(question, level);
    } catch (geminiError) {
      console.warn('[Gemini] Mentor AI failed:', geminiError.message);
    }

    res.json({
      mentor_response: baseResponse,
      ai_insight: aiInsight,
      gemini_powered: isGeminiAvailable()
    });
  } catch (error) {
    console.error('[API] Mentor error:', error.message);
    res.status(500).json({ error: 'Mentor engine encountered an error.' });
  }
});

/**
 * @route POST /api/analyze-strategy
 * @description Quick strategy analysis with Google Gemini AI commentary.
 * Evaluates strategy-region-audience fit and provides AI-generated insights.
 * @param {Object} req.body - Strategy parameters
 * @returns {Object} Effectiveness scores with Gemini analysis
 */
app.post('/api/analyze-strategy', (req, res) => {
  try {
    const { region_type, campaign_strategy, target_audience, budget } = req.body;

    if (!region_type || !campaign_strategy || !target_audience) {
      return res.status(400).json({ error: 'Missing required fields: region_type, campaign_strategy, target_audience.' });
    }

    const { STRATEGY_REGION_SCORES, AUDIENCE_STRATEGY_FIT, BUDGET_MULTIPLIERS } = require('./engine/constants');

    const regionScore = STRATEGY_REGION_SCORES[campaign_strategy]?.[region_type] || 50;
    const audienceScore = AUDIENCE_STRATEGY_FIT[target_audience]?.[campaign_strategy] || 50;
    const budgetMult = BUDGET_MULTIPLIERS[budget] || 1.0;
    const effectiveness = Math.min(Math.round(((regionScore + audienceScore) / 2) * budgetMult), 100);

    const recommendation = effectiveness > 70
      ? 'Strong strategy'
      : effectiveness > 50
        ? 'Moderate — consider adjustments'
        : 'Weak — significant changes needed';

    // Enhance with Google Gemini AI analysis
    const params = { region_type, campaign_strategy, target_audience, budget };
    const scores = { effectiveness, regionFit: regionScore, audienceFit: audienceScore };

    analyzeStrategyAI(params, scores).then(aiAnalysis => {
      res.json({
        strategy_effectiveness: effectiveness,
        region_fit: regionScore,
        audience_fit: audienceScore,
        budget_impact: budgetMult,
        recommendation,
        ai_analysis: aiAnalysis,
        gemini_powered: isGeminiAvailable()
      });
    }).catch(() => {
      res.json({
        strategy_effectiveness: effectiveness,
        region_fit: regionScore,
        audience_fit: audienceScore,
        budget_impact: budgetMult,
        recommendation,
        ai_analysis: null,
        gemini_powered: false
      });
    });
  } catch (error) {
    console.error('[API] Analysis error:', error.message);
    res.status(500).json({ error: 'Analysis engine encountered an error.' });
  }
});

// ─── Helper Functions ──────────────────────────────────────────

/**
 * Builds a normalized simulation input object from request body.
 * @param {Object} body - Raw request body
 * @returns {Object} Normalized simulation input
 */
function buildSimulationInput(body) {
  return {
    user_role: body.user_role || 'candidate',
    user_level: body.user_level || 'beginner',
    region_type: body.region_type,
    budget: body.budget,
    campaign_strategy: body.campaign_strategy,
    promises: Array.isArray(body.promises) ? body.promises : [body.promises],
    target_audience: body.target_audience,
    opponent_strength: body.opponent_strength || 'medium',
    incumbency: body.incumbency || false,
    coalition: body.coalition || false
  };
}

// ─── SPA Catch-all ─────────────────────────────────────────────

/** Serve index.html for all non-API routes (SPA support) */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Global Error Handler ──────────────────────────────────────

/**
 * Global error handling middleware.
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} _next - Next middleware
 */
app.use((err, req, res, _next) => {
  console.error('[ERROR] Unhandled:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Server Startup ────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n[Server] Electra AI Engine running on http://localhost:${PORT}`);
    console.log(`[Server] Election Simulator ready`);
    console.log(`[Gemini] Google AI: ${isGeminiAvailable() ? 'Connected' : 'Fallback mode'}\n`);
  });
}

module.exports = app;
