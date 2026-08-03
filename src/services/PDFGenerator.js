// src/services/PDFGenerator.js
'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const STORAGE_BASE = process.env.STORAGE_PATH || 'storage';

class PDFGenerator {
  constructor(options = {}) {
    this.basePath = options.basePath || STORAGE_BASE;
    try {
      if (!fs.existsSync(this.basePath)) {
        fs.mkdirSync(this.basePath, { recursive: true });
      }
    } catch (err) {
      logger.warn('pdf_basepath_create_failed', { message: err.message });
    }
  }

  // generateStoryPDF(projectId, content, version = 1)
  async generateStoryPDF(projectId, content, version = 1) {
    const projectDir = path.join(this.basePath, 'Stories', projectId);
    try {
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      const filename = `story_v${version}.pdf`;
      const filePath = path.join(projectDir, filename);

      const doc = new PDFDocument({ autoFirstPage: true });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(18).text(`Story - ${projectId}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(content, { align: 'left' });

      doc.end();

      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      logger.info('pdf_generated', { projectId, filePath });
      return filePath;
    } catch (err) {
      logger.error('pdf_generate_error', { message: err.message, projectId });
      throw err;
    }
  }
}

module.exports = PDFGenerator;
