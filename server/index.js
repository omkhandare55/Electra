require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { simulateElection } = require('./engine/simulator');
const { generateFeedback } = require('./engine/feedback');
const { mentorResponse } = require('./engine/mentor');
const { validateSimulationInput, validateMentorInput } = require('./middleware/validator');
const { sanitizeMiddleware } = require('./middleware/sanitizer');
const { initializeGemini, generateSmartAdvice, generateMentorAI, isGeminiAvailable } = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security Middleware ───────────────────────────────────────
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

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' }));
app.use(sanitizeMiddleware);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' }
});
app.use('/api/', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize Google Gemini
initializeGemini();

// ─── API Routes ────────────────────────────────────────────────

/** Health check */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Electra AI v1.0',
    gemini: isGeminiAvailable(),
    timestamp: new Date().toISOString()
  });
});

/** Main election simulation */
app.post('/api/simulate', validateSimulationInput, async (req, res) => {
  try {
    const input = {
      user_role: req.body.user_role || 'candidate',
      user_level: req.body.user_level || 'beginner',
      region_type: req.body.region_type,
      budget: req.body.budget,
      campaign_strategy: req.body.campaign_strategy,
      promises: Array.isArray(req.body.promises) ? req.body.promises : [req.body.promises],
      target_audience: req.body.target_audience,
      opponent_strength: req.body.opponent_strength || 'medium',
      incumbency: req.body.incumbency || false,
      coalition: req.body.coalition || false
    };

    const result = simulateElection(input);
    const analysis = generateFeedback(input, result);

    res.json({
      simulation_result: result,
      analysis,
      mentor_response: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Simulation engine error.' });
  }
});

/** AI-powered smart advice (Google Gemini) */
app.post('/api/smart-advice', validateSimulationInput, async (req, res) => {
  try {
    const input = {
      user_role: req.body.user_role || 'candidate',
      user_level: req.body.user_level || 'beginner',
      region_type: req.body.region_type,
      budget: req.body.budget,
      campaign_strategy: req.body.campaign_strategy,
      promises: Array.isArray(req.body.promises) ? req.body.promises : [req.body.promises],
      target_audience: req.body.target_audience,
      opponent_strength: req.body.opponent_strength || 'medium',
      incumbency: req.body.incumbency || false,
      coalition: req.body.coalition || false
    };

    const result = simulateElection(input);
    const analysis = generateFeedback(input, result);
    const smartAdvice = await generateSmartAdvice(input, result, analysis);

    res.json({
      simulation_result: result,
      analysis,
      smart_advice: smartAdvice,
      gemini_powered: isGeminiAvailable(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Smart advice error:', error);
    res.status(500).json({ error: 'Smart advice engine error.' });
  }
});

/** Education/mentor endpoint */
app.post('/api/mentor', validateMentorInput, async (req, res) => {
  try {
    const { question, user_level } = req.body;
    const level = user_level || 'beginner';

    const baseResponse = mentorResponse(question, level);
    const aiEnhancement = await generateMentorAI(question, level);

    res.json({
      mentor_response: baseResponse,
      ai_insight: aiEnhancement,
      gemini_powered: isGeminiAvailable()
    });
  } catch (error) {
    console.error('Mentor error:', error);
    res.status(500).json({ error: 'Mentor engine error.' });
  }
});

/** Strategy quick-analysis */
app.post('/api/analyze-strategy', (req, res) => {
  try {
    const { region_type, campaign_strategy, target_audience, budget } = req.body;
    if (!region_type || !campaign_strategy || !target_audience) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const { STRATEGY_REGION_SCORES, AUDIENCE_STRATEGY_FIT, BUDGET_MULTIPLIERS } = require('./engine/constants');
    const regionScore = STRATEGY_REGION_SCORES[campaign_strategy]?.[region_type] || 50;
    const audienceScore = AUDIENCE_STRATEGY_FIT[target_audience]?.[campaign_strategy] || 50;
    const budgetMult = BUDGET_MULTIPLIERS[budget] || 1.0;
    const effectiveness = Math.min(Math.round(((regionScore + audienceScore) / 2) * budgetMult), 100);

    res.json({
      strategy_effectiveness: effectiveness,
      region_fit: regionScore,
      audience_fit: audienceScore,
      budget_impact: budgetMult,
      recommendation: effectiveness > 70 ? 'Strong strategy' : effectiveness > 50 ? 'Moderate — consider adjustments' : 'Weak — significant changes needed'
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis engine error.' });
  }
});

/** Catch-all: serve SPA */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Error handling ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start server (only if not in test mode) ──────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n⚡ Electra AI Engine running on http://localhost:${PORT}`);
    console.log(`🗳️  Election Simulator ready`);
    console.log(`🤖 Gemini AI: ${isGeminiAvailable() ? 'Connected' : 'Fallback mode'}\n`);
  });
}

module.exports = app;
