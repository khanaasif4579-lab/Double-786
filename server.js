// server.js
// Boot system for ASIF ALI STUDIO backend (Owner-only, no auth)

'use strict';

require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./src/utils/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const ownerInjector = require('./src/middleware/owner');

// Read configuration from environment with sensible defaults
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asif-ali-studio';
const MAX_PAYLOAD = process.env.MAX_FILE_SIZE ? `${process.env.MAX_FILE_SIZE}b` : '10mb';
const RATE_LIMIT_REQUESTS = process.env.RATE_LIMIT_REQUESTS ? parseInt(process.env.RATE_LIMIT_REQUESTS, 10) : 100;
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW, 10) : 15 * 60 * 1000;
const SHUTDOWN_TIMEOUT_MS = process.env.SHUTDOWN_TIMEOUT_MS ? parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10) : 30000;

const app = express();

// Security and basic middleware
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL === '*' ? '*' : FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: MAX_PAYLOAD }));
app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize());

// Rate limiter (global)
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  logger.info('http_request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Owner injector (owner-only app): inject req.user so controllers that expect req.user work.
app.use(ownerInjector);

// Health endpoint (always available)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Delay requiring routes/controllers until after DB connection
let server;

async function startServer() {
  try {
    logger.info('server_starting', { env: process.env.NODE_ENV || 'development' });

    // Connect to MongoDB first
    logger.info('mongodb_connecting', { uri: MONGODB_URI });
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('mongodb_connected');

    // Now mount routes (these will use existing controllers and the new services)
    const apiRoutes = require('./src/routes');
    app.use('/api/v1', apiRoutes);

    // 404 handler (after routes)
    app.use((req, res) => {
      res.status(404).json({ success: false, error: 'Not Found' });
    });

    // Global error handler
    app.use(errorHandler);

    // Start HTTP server
    server = http.createServer(app);
    server.listen(PORT, () => {
      logger.info('server_listening', { port: PORT });
    });

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      try {
        logger.info('shutdown_initiated', { signal });
        if (server) {
          server.close(async (err) => {
            if (err) {
              logger.error('server_close_error', { message: err.message, stack: err.stack });
              process.exit(1);
            }
            try {
              await mongoose.disconnect();
              logger.info('mongodb_disconnected');
              process.exit(0);
            } catch (e) {
              logger.error('mongodb_disconnect_error', { message: e.message, stack: e.stack });
              process.exit(1);
            }
          });
        } else {
          await mongoose.disconnect();
          process.exit(0);
        }

        setTimeout(() => {
          logger.warn('shutdown_forced_exit');
          process.exit(1);
        }, SHUTDOWN_TIMEOUT_MS).unref();
      } catch (err) {
        logger.error('shutdown_error', { message: err.message, stack: err.stack });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('uncaughtException', (err) => {
      logger.error('uncaughtException', { message: err.message, stack: err.stack });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('unhandledRejection', { reason });
    });
  } catch (err) {
    logger.error('start_error', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

// Start when run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
