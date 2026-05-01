'use strict';

/**
 * Sanitizes string input to prevent XSS and injection attacks.
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Recursively sanitizes all string values in an object.
 * @param {*} obj - Input data
 * @returns {*} Sanitized data
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Express middleware that sanitizes request body.
 */
function sanitizeMiddleware(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = { sanitizeMiddleware, sanitizeString, sanitizeObject };
