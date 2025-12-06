
const winston = require('winston');
const path = require('path');

const logDir = 'logs';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'algo-trading' },
    transports: [
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;

module.exports.logTraining = (message) => logger.info(`[TRAINING] ${message}`);
module.exports.logError = (error, meta = {}) => logger.error(error.message, { ...meta, stack: error.stack });
module.exports.logTrade = (message) => logger.info(`[TRADE] ${message}`);
module.exports.logSystem = (message) => logger.info(`[SYSTEM] ${message}`);
