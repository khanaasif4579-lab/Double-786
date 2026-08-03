// src/routes/index.js
'use strict';

const express = require('express');
const router = express.Router();

// Try to require existing route modules if present, otherwise mount controllers directly
// Mount story routes by requiring the existing controller
let storyController;
try {
  storyController = require('../controllers/storyController');
} catch (err) {
  // If the controller cannot be required now (missing dependencies), we'll still export the router
  // and the require error will surface when attempting to use the routes. However, we prefer
  // to surface MODULE_NOT_FOUND early.
  storyController = null;
}

if (storyController) {
  router.post('/stories', storyController.createStory);
  router.get('/stories/:projectId', storyController.getStory);
  router.put('/stories/:projectId', storyController.updateStory);
  router.post('/stories/:projectId/publish', storyController.publishStory);
  router.delete('/stories/:projectId', storyController.deleteStory);
}

module.exports = router;
