// src/middleware/owner.js
'use strict';

const config = {
  ownerId: process.env.OWNER_ID || 'OWNER_LOCAL_1',
  ownerName: process.env.OWNER_NAME || 'ASIF_OWNER',
  ownerLanguage: process.env.OWNER_LANGUAGE || 'en'
};

// Owner injector middleware: sets req.user to a single-owner object for owner-only app.
function ownerInjector(req, res, next) {
  try {
    req.user = {
      _id: config.ownerId,
      fullName: config.ownerName,
      userType: 'admin',
      language: config.ownerLanguage,
      email: process.env.OWNER_EMAIL || 'owner@local'
    };
    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('ownerInjector error:', err && err.message);
    next();
  }
}

module.exports = ownerInjector;
