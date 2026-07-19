// API Integration Model

const mongoose = require('mongoose');
const crypto = require('crypto');

const apiIntegrationSchema = new mongoose.Schema({
  // API Information
  apiName: {
    type: String,
    required: [true, 'Please provide an API name'],
    unique: true
  },

  provider: {
    type: String,
    required: true,
    enum: [
      'openai',
      'anthropic',
      'soundraw',
      'amper',
      'elevenlabs',
      'dalle',
      'stable-diffusion',
      'custom'
    ]
  },

  // Credentials (Encrypted)
  apiKeyEncrypted: {
    type: String,
    required: true,
    select: false
  },

  apiKeyIV: {
    type: String,
    select: false
  },

  // Configuration
  baseUrl: {
    type: String,
    required: true
  },

  apiVersion: {
    type: String,
    default: 'v1'
  },

  // Service Type
  serviceType: {
    type: String,
    enum: [
      'story_generation',
      'music_generation',
      'voice_generation',
      'image_generation',
      'video_generation',
      'midi_processing',
      'custom'
    ],
    required: true
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  isEnabled: {
    type: Boolean,
    default: true
  },

  // Fallback Configuration
  fallbackApiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'APIIntegration'
  },

  // Rate Limiting
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 100
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },

  // Timeout Configuration
  timeout: {
    type: Number,
    default: 30, // seconds
    min: 5,
    max: 300
  },

  // Last Test Results
  lastTestedAt: Date,

  testStatus: {
    type: String,
    enum: ['ok', 'failed', 'warning', 'not_tested'],
    default: 'not_tested'
  },

  testMessage: String,

  lastTestResult: mongoose.Schema.Types.Mixed,

  // Error Tracking
  errorCount: {
    type: Number,
    default: 0
  },

  lastErrorMessage: String,

  lastErrorAt: Date,

  // Usage Statistics
  stats: {
    totalRequests: {
      type: Number,
      default: 0
    },
    successfulRequests: {
      type: Number,
      default: 0
    },
    failedRequests: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0 // milliseconds
    },
    totalCost: {
      type: Number,
      default: 0
    }
  },

  // Pricing Information
  pricing: {
    costPerRequest: Number,
    costPerToken: Number,
    costPerMinute: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Documentation Links
  documentationUrl: String,
  supportUrl: String,
  statusPageUrl: String,

  // Custom Headers
  customHeaders: mongoose.Schema.Types.Mixed,

  // Request/Response Mapping
  requestSchema: mongoose.Schema.Types.Mixed,
  responseSchema: mongoose.Schema.Types.Mixed,

  // Additional Settings
  settings: mongoose.Schema.Types.Mixed,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  deletedAt: Date
});

// Encrypt API key before saving
apiIntegrationSchema.pre('save', function(next) {
  if (!this.isModified('apiKeyEncrypted')) {
    return next();
  }

  const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'default-key-32-chars-long-here';
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  
  let encrypted = cipher.update(this.apiKeyEncrypted, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  this.apiKeyEncrypted = encrypted;
  this.updatedAt = Date.now();
  next();
});

// Method to decrypt API key
apiIntegrationSchema.methods.getApiKey = function() {
  const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'default-key-32-chars-long-here';
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  
  let decrypted = decipher.update(this.apiKeyEncrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Method to update stats
apiIntegrationSchema.methods.recordRequest = function(success, responseTime, cost = 0) {
  this.stats.totalRequests++;
  
  if (success) {
    this.stats.successfulRequests++;
  } else {
    this.stats.failedRequests++;
    this.errorCount++;
  }
  
  // Update average response time
  const avgTime = this.stats.averageResponseTime;
  const totalRequests = this.stats.totalRequests;
  this.stats.averageResponseTime = 
    (avgTime * (totalRequests - 1) + responseTime) / totalRequests;
  
  this.stats.totalCost += cost;
  
  return this.save();
};

// Indexes
apiIntegrationSchema.index({ serviceType: 1, isActive: 1 });
apiIntegrationSchema.index({ provider: 1 });
apiIntegrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('APIIntegration', apiIntegrationSchema);
