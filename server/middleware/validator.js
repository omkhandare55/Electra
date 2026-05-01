'use strict';

const { VALID_VALUES } = require('../engine/constants');

/**
 * Validates simulation input fields against allowed values.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function validateSimulationInput(req, res, next) {
  const errors = [];
  const body = req.body;

  // Required fields check
  const required = ['region_type', 'budget', 'campaign_strategy', 'promises', 'target_audience'];
  for (const field of required) {
    if (!body[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });

  // Enum validation
  const enumFields = ['user_role', 'user_level', 'region_type', 'budget', 'campaign_strategy', 'target_audience', 'opponent_strength'];
  for (const field of enumFields) {
    if (body[field] && VALID_VALUES[field] && !VALID_VALUES[field].includes(body[field])) {
      errors.push(`Invalid value for ${field}: "${body[field]}". Allowed: ${VALID_VALUES[field].join(', ')}`);
    }
  }

  // Promises validation
  if (body.promises) {
    if (!Array.isArray(body.promises)) {
      errors.push('promises must be an array');
    } else if (body.promises.length === 0) {
      errors.push('promises must contain at least one item');
    } else if (body.promises.length > 7) {
      errors.push('Maximum 7 promises allowed');
    } else {
      for (const p of body.promises) {
        if (!VALID_VALUES.promises.includes(p)) {
          errors.push(`Invalid promise: "${p}". Allowed: ${VALID_VALUES.promises.join(', ')}`);
        }
      }
    }
  }

  // Boolean validation
  if (body.incumbency !== undefined && typeof body.incumbency !== 'boolean') {
    errors.push('incumbency must be a boolean');
  }
  if (body.coalition !== undefined && typeof body.coalition !== 'boolean') {
    errors.push('coalition must be a boolean');
  }

  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });
  next();
}

/**
 * Validates mentor/education input.
 */
function validateMentorInput(req, res, next) {
  const { question, user_level } = req.body;
  const errors = [];

  if (!question || typeof question !== 'string') {
    errors.push('question is required and must be a string');
  } else if (question.trim().length < 3) {
    errors.push('question must be at least 3 characters');
  } else if (question.length > 500) {
    errors.push('question must be under 500 characters');
  }

  if (user_level && !VALID_VALUES.user_level.includes(user_level)) {
    errors.push(`Invalid user_level: "${user_level}". Allowed: ${VALID_VALUES.user_level.join(', ')}`);
  }

  if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });
  next();
}

module.exports = { validateSimulationInput, validateMentorInput };
