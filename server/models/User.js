const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email address'
    ],
    index: true,
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Employee ID must be at least 3 characters'],
    maxlength: [20, 'Employee ID cannot exceed 20 characters'],
    index: true,
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't include password in queries by default
  },
  
  // Personal Information
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[0-9\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[\+]?[0-9\s\-\(\)]{10,15}$/.test(v);
        },
        message: 'Please provide a valid emergency contact phone number'
      }
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, 'Relationship cannot exceed 50 characters']
    }
  },
  profilePicture: {
    type: String,
    trim: true
  },
  
  // Authorization & Role Management
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'employee'],
      message: 'Role must be either admin, manager, or employee'
    },
    default: 'employee',
    index: true,
  },
  permissions: {
    type: [String],
    default: [],
    validate: {
      validator: function(permissions) {
        const validPermissions = [
          'view_policies', 'manage_policies', 'create_policies',
          'view_training', 'manage_training', 'create_training',
          'view_compliance', 'manage_compliance', 'audit_compliance',
          'view_risks', 'manage_risks', 'assess_risks',
          'view_users', 'manage_users', 'admin_users',
          'view_reports', 'generate_reports', 'export_data',
          // Enhanced RBAC permissions
          'policy.create', 'policy.edit', 'policy.delete', 'policy.view.all',
          'user.create', 'user.edit', 'user.delete', 'user.view.all',
          'admin.access', 'reports.generate', 'audit.view'
        ];
        return permissions.every(permission => validPermissions.includes(permission));
      },
      message: 'Invalid permission specified'
    }
  },
  
  // Organizational Information
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    minlength: [2, 'Department must be at least 2 characters'],
    maxlength: [50, 'Department cannot exceed 50 characters'],
    index: true,
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters'],
  },
  
  // Enhanced RBAC fields (NEW - non-breaking additions)
  accessLevel: {
    type: Number,
    min: 1,     // Employee level
    max: 10,    // Super admin level
    default: 1, // Default to employee level
    index: true
  },
  
  adminCapabilities: [{
    role: String,        // 'policy_admin', 'user_admin', 'reports_admin'
    departments: [String], // Which departments they can manage
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Security Features
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  
  // Two-Factor Authentication
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  backupCodes: [String],
  
  // Activity Tracking
  lastLogin: Date,
  lastPasswordChange: Date,
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    success: {
      type: Boolean,
      default: true,
    },
    location: String,
  }],
  
  // Training & Compliance
  trainingProgress: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingModule',
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'expired'],
      default: 'not_started',
    },
    score: Number,
    completedAt: Date,
    attempts: {
      type: Number,
      default: 0,
    },
  }],
  
  policyAcknowledgments: [{
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
    },
    version: String,
    acknowledgedAt: Date,
    ipAddress: String,
  }],
  
  // Risk & Compliance Scores
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  complianceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  
  // Notifications & Preferences
  notificationPreferences: {
    email: {
      policyUpdates: { type: Boolean, default: true },
      trainingReminders: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      complianceDeadlines: { type: Boolean, default: true },
    },
    inApp: {
      policyUpdates: { type: Boolean, default: true },
      trainingReminders: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      complianceDeadlines: { type: Boolean, default: true },
    },
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ employeeId: 1, isActive: 1 });
userSchema.index({ role: 1, department: 1 });
userSchema.index({ 'trainingProgress.status': 1 });
userSchema.index({ createdAt: -1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

userSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have exceeded max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

userSchema.methods.addLoginHistory = async function(ip, userAgent, success = true, location = '') {
  this.loginHistory.unshift({
    ip,
    userAgent,
    success,
    location,
    timestamp: new Date()
  });
  
  // Keep only last 10 login records
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(0, 10);
  }
  
  return this.save();
};

// Enhanced RBAC Methods (NEW - non-breaking additions)
userSchema.methods.canAccessAdmin = function() {
  return this.accessLevel >= 5 || this.role === 'admin';
};

userSchema.methods.canManageDepartment = function(department) {
  // Admins can manage all departments
  if (this.role === 'admin') return true;
  
  // Check if they have specific admin capabilities for this department
  return this.adminCapabilities.some(cap => 
    cap.departments.includes(department) || cap.departments.includes('all')
  );
};

userSchema.methods.getEffectivePermissions = function() {
  let effectivePermissions = [...this.permissions];
  
  // Add role-based permissions
  if (this.role === 'admin') {
    effectivePermissions = effectivePermissions.concat([
      'policy.create', 'policy.edit', 'policy.delete', 'policy.view.all',
      'user.create', 'user.edit', 'user.delete', 'user.view.all',
      'admin.access', 'reports.generate', 'audit.view'
    ]);
  } else if (this.role === 'manager') {
    effectivePermissions = effectivePermissions.concat([
      'policy.view.all', 'reports.generate'
    ]);
  }
  
  // Remove duplicates and return
  return [...new Set(effectivePermissions)];
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.statics.findByEmployeeId = function(employeeId) {
  return this.findOne({ employeeId, isActive: true });
};

userSchema.statics.getActiveUsers = function() {
  return this.find({ isActive: true });
};

userSchema.statics.getUsersByDepartment = function(department) {
  return this.find({ department, isActive: true });
};

userSchema.statics.getUsersByRole = function(role) {
  return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);