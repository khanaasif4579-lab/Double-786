// Purchase Model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const purchaseSchema = new mongoose.Schema({
  // Unique Identifiers
  licenseId: {
    type: String,
    unique: true,
    default: () => `LIC_${uuidv4().substring(0, 12).toUpperCase()}`
  },

  // User and Product
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Payment Information
  amount: {
    type: Number,
    required: true,
    default: 15000
  },

  currency: {
    type: String,
    default: 'INR'
  },

  discountApplied: {
    type: Number,
    default: 0
  },

  finalAmount: {
    type: Number,
    required: true
  },

  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'netbanking', 'wallet'],
    required: true
  },

  // Transaction Details
  transactionId: {
    type: String,
    required: true,
    unique: true
  },

  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal'],
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },

  // License Information
  licenseCertificatePath: String,

  invoicePath: String,

  licenseKey: {
    type: String,
    unique: true,
    default: () => `ASL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },

  // Download Tracking
  downloadCount: {
    type: Number,
    default: 0
  },

  maxDownloads: {
    type: Number,
    default: -1 // -1 means unlimited
  },

  lastDownloadAt: Date,

  downloadHistory: [{
    downloadedAt: Date,
    ipAddress: String,
    userAgent: String
  }],

  // License Period
  purchasedAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
  },

  isExpired: {
    type: Boolean,
    default: false
  },

  // Refund Information
  refundRequested: {
    type: Boolean,
    default: false
  },

  refundRequestedAt: Date,

  refundApprovedAt: Date,

  refundReason: String,

  // Additional Details
  notes: String,

  ipAddress: String,

  // Metadata
  downloadLinks: [{
    type: {
      type: String,
      enum: ['pdf', 'mp3', 'wav', 'certificate', 'invoice']
    },
    url: String,
    expiresAt: Date
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
purchaseSchema.index({ userId: 1, createdAt: -1 });
purchaseSchema.index({ projectId: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ licenseId: 1 });
purchaseSchema.index({ expiresAt: 1 });

// Update timestamps
purchaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if license is valid
purchaseSchema.methods.isLicenseValid = function() {
  return this.status === 'completed' && 
         (!this.expiresAt || this.expiresAt > Date.now());
};

// Check if download limit reached
purchaseSchema.methods.canDownload = function() {
  if (this.maxDownloads === -1) return true; // unlimited
  return this.downloadCount < this.maxDownloads;
};

// Record download
purchaseSchema.methods.recordDownload = function(ipAddress, userAgent) {
  if (this.canDownload()) {
    this.downloadCount++;
    this.lastDownloadAt = Date.now();
    this.downloadHistory.push({
      downloadedAt: Date.now(),
      ipAddress,
      userAgent
    });
    return this.save();
  }
  throw new Error('Download limit exceeded');
};

module.exports = mongoose.model('Purchase', purchaseSchema);
