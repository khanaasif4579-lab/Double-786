// Project Model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const projectSchema = new mongoose.Schema({
  // Unique Identifiers
  projectId: {
    type: String,
    unique: true,
    default: () => `PRJ_${uuidv4().substring(0, 8)}`
  },

  // Basic Information
  title: {
    type: String,
    required: [true, 'Please provide a project title'],
    maxlength: 100
  },

  description: {
    type: String,
    maxlength: 5000
  },

  // Creator Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // File Paths
  storyFile: {
    type: String,
    required: true
  },

  bgmFile: {
    type: String
  },

  coverImageFile: {
    type: String
  },

  screenplayFile: {
    type: String
  },

  // Classification
  genre: {
    type: [String],
    enum: [
      'Drama',
      'Romance',
      'Action',
      'Comedy',
      'Thriller',
      'Horror',
      'Fantasy',
      'Sci-Fi',
      'Documentary',
      'Educational'
    ]
  },

  mood: {
    type: [String],
    enum: [
      'Happy',
      'Sad',
      'Thrilling',
      'Romantic',
      'Mysterious',
      'Peaceful',
      'Intense',
      'Playful'
    ]
  },

  // Metadata
  metadata: {
    duration: Number, // in minutes
    characterCount: Number,
    sceneCount: Number,
    language: {
      type: String,
      enum: ['en', 'hi', 'ur', 'es', 'fr', 'de', 'zh', 'ja'],
      default: 'en'
    },
    contentRating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
      default: 'PG'
    }
  },

  // Search and Discovery
  searchTags: [String],

  keywords: [String],

  // Content Status
  status: {
    type: String,
    enum: ['draft', 'in_review', 'approved', 'published', 'archived'],
    default: 'draft'
  },

  isPublished: {
    type: Boolean,
    default: false
  },

  publishedAt: Date,

  // Versioning
  version: {
    type: Number,
    default: 1
  },

  versionHistory: [{
    version: Number,
    storyFile: String,
    bgmFile: String,
    createdAt: Date,
    notes: String
  }],

  // Pricing and Licensing
  pricing: {
    amount: {
      type: Number,
      default: 15000
    },
    currency: {
      type: String,
      default: 'INR'
    },
    discountPercentage: {
      type: Number,
      default: 0
    }
  },

  // Engagement Metrics
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    previews: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },

  // AI Generation Details
  aiGenerationDetails: {
    storyGeneratedBy: String, // API used
    musicGeneratedBy: String,
    generationPrompt: String,
    customSettings: mongoose.Schema.Types.Mixed
  },

  // Project Settings
  settings: {
    allowDownload: {
      type: Boolean,
      default: false
    },
    allowPreview: {
      type: Boolean,
      default: true
    },
    previewDuration: {
      type: Number,
      default: 30 // seconds
    },
    requiresApproval: {
      type: Boolean,
      default: true
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  archivedAt: Date,

  deletedAt: Date
});

// Indexes for faster queries
projectSchema.index({ createdBy: 1, createdAt: -1 });
projectSchema.index({ status: 1, isPublished: 1 });
projectSchema.index({ genre: 1, mood: 1 });
projectSchema.index({ searchTags: 1 });
projectSchema.index({ 'metadata.language': 1 });

// Update timestamps
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Soft delete
projectSchema.methods.softDelete = function() {
  this.deletedAt = Date.now();
  this.isPublished = false;
  return this.save();
};

// Get public data only
projectSchema.methods.getPublicData = function() {
  const obj = this.toObject();
  if (!this.isPublished) {
    delete obj.storyFile;
    delete obj.bgmFile;
  }
  return obj;
};

module.exports = mongoose.model('Project', projectSchema);
