const Joi = require('joi');

/**
 * Email validation
 */
function validateEmail(email) {
  const schema = Joi.string().email().required();
  const { error } = schema.validate(email);
  return !error;
}

/**
 * Password validation
 * Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
 */
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!password || password.length < minLength) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

/**
 * Validate symbol format
 */
function validateSymbol(symbol) {
  const schema = Joi.string().uppercase().min(1).max(10).required();
  const { error } = schema.validate(symbol);
  return !error;
}

/**
 * Validate date range
 */
function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }

  if (start >= end) {
    return { valid: false, message: 'Start date must be before end date' };
  }

  if (end > new Date()) {
    return { valid: false, message: 'End date cannot be in the future' };
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent injection
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '');
}

module.exports = {
  validateEmail,
  validatePassword,
  validateSymbol,
  validateDateRange,
  sanitizeInput,
};
