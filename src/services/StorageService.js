// src/services/StorageService.js
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const STORAGE_BASE = process.env.STORAGE_PATH || 'storage';

class StorageService {
  constructor(options = {}) {
    this.basePath = options.basePath || STORAGE_BASE;
    try {
      if (!fs.existsSync(this.basePath)) {
        fs.mkdirSync(this.basePath, { recursive: true });
      }
    } catch (err) {
      logger.warn('storage_basepath_create_failed', { message: err.message });
    }
  }

  // saveStory(projectId, content, version = 1)
  async saveStory(projectId, content, version = 1) {
    try {
      const projectDir = path.join(this.basePath, 'Stories', projectId);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      const filename = `story_v${version}.txt`;
      const filePath = path.join(projectDir, filename);
      await fs.promises.writeFile(filePath, content, 'utf8');
      logger.info('storage_save_story', { projectId, filePath });
      return filePath;
    } catch (err) {
      logger.error('storage_save_error', { message: err.message, projectId });
      throw err;
    }
  }
}

module.exports = StorageService;
