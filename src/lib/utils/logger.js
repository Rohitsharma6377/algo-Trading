const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'algo-trader' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // Write trading activity to trades.log
    new winston.transports.File({
      filename: path.join(logDir, 'trades.log'),
      level: 'info',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Log prediction event
 */
function logPrediction(symbol, prediction, confidence) {
  logger.info('Prediction generated', {
    type: 'PREDICTION',
    symbol,
    prediction,
    confidence,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log training event
 */
function logTraining(symbol, metrics) {
  logger.info('Model training completed', {
    type: 'TRAINING',
    symbol,
    metrics,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log trade execution
 */
function logTrade(tradeData) {
  logger.info('Trade executed', {
    type: 'TRADE',
    ...tradeData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log admin action
 */
function logAdminAction(action, userId, details) {
  logger.info('Admin action performed', {
    type: 'ADMIN_ACTION',
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log error with context
 */
function logError(error, context = {}) {
  logger.error('Error occurred', {
    type: 'ERROR',
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  logger,
  logPrediction,
  logTraining,
  logTrade,
  logAdminAction,
  logError,
};
