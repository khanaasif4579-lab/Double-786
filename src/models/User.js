// User Model

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // Don't return password by default
  },

  fullName: {
    type: String,
    required: [true, 'Please provide your name']
  },

  phone: {
    type: String,
    match: [
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      'Please provide a valid phone number'
    ]
  },

  // Role and Permissions
  userType: {
    type: String,
    enum: ['admin', 'staff', 'public'],
    default: 'public'
  },

  permissions: [{
    type: String,
    enum: [
      'create_story',
      'edit_story',
      'generate_music',
      'manage_library',
      'publish_content',
      'manage_apis',
      'view_analytics',
      'manage_users',
      'manage_payments'
    ]
  }],

  // 2FA Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  twoFactorSecret: {
    type: String,
    select: false
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },

  emailVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: String,
  verificationTokenExpires: Date,

  passwordResetToken: String,
  passwordResetExpires: Date,

  // Preferences
  language: {
    type: String,
    enum: ['en', 'hi', 'ur', 'es', 'fr', 'de', 'zh', 'ja'],
    default: 'en'
  },

  timezone: {
    type: String,
    default: 'UTC'
  },

  // Activity Tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: Date,

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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.passwordResetToken;
  delete obj.verificationToken;
  return obj;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Lock account after failed attempts
userSchema.methods.lockAccount = function() {
  this.lockUntil = Date.now() + 3600000; // 1 hour
  return this.save();
};

// Unlock account
userSchema.methods.unlockAccount = function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
