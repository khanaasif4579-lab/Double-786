// src/middleware/errorHandler.js
'use strict';

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  try {
    logger.error('unhandled_error', {
      message: err && err.message,
      stack: err && err.stack,
      url: req && req.originalUrl,
      method: req && req.method
    });
  } catch (logErr) {
    // eslint-disable-next-line no-console
    console.error('Logger error in errorHandler:', logErr && logErr.message);
  }

  const status = err && (err.status || err.statusCode) ? (err.status || err.statusCode) : 500;
  const payload = {
    success: false,
    error: (process.env.NODE_ENV === 'production') ? 'Internal Server Error' : (err && err.message) || 'Internal Server Error'
  };

  if (process.env.NODE_ENV !== 'production' && err && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = { errorHandler };
