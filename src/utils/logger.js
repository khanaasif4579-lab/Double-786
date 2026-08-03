// src/utils/logger.js
'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');
const logFile = process.env.LOG_FILE || 'logs/app.log';
const logLevel = process.env.LOG_LEVEL || 'info';

const logDir = path.dirname(logFile);
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (e) {
  // If creation fails, fall back to console-only logging
  // Do not throw
  // eslint-disable-next-line no-console
  console.warn('Could not create log directory:', e && e.message);
}

const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      level: logLevel,
      format: format.combine(format.colorize(), format.simple())
    }),
    new transports.File({ filename: logFile, level: logLevel })
  ],
  exitOnError: false
});

module.exports = logger;
