const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Policy title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Policy description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  content: {
    type: String,
    required: [true, 'Policy content is required'],
  },
  
  // Classification & Organization
  category: {
    type: String,
    required: [true, 'Policy category is required'],
    enum: {
      values: [
        'information_security',
        'data_protection',
        'access_control',
        'incident_response',
        'business_continuity',
        'risk_management',
        'compliance',
        'hr_security',
        'physical_security',
        'vendor_management'
      ],
      message: 'Invalid policy category'
    },
    index: true,
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Subcategory cannot exceed 100 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  
  // Version Control
  version: {
    type: String,
    required: [true, 'Policy version is required'],
    default: '1.0',
  },
  previousVersions: [{
    version: String,
    content: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedAt: Date,
    changeLog: String,
  }],
  
  // Status & Lifecycle
  status: {
    type: String,
    enum: {
      values: ['draft', 'review', 'approved', 'published', 'archived', 'deprecated'],
      message: 'Invalid policy status'
    },
    default: 'draft',
    index: true,
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Invalid priority level'
    },
    default: 'medium',
    index: true,
  },
  
  // Compliance & Regulatory
  regulatoryFrameworks: [{
    type: String,
    enum: [
      'ISO_27001',
      'NIST',
      'GDPR',
      'HIPAA',
      'SOX',
      'PCI_DSS',
      'COBIT',
      'COSO',
      'local_regulations'
    ],
  }],
  complianceRequirements: [{
    framework: String,
    requirement: String,
    description: String,
  }],
  
  // Approval Workflow
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    comments: String,
    reviewedAt: Date,
  }],
  
  // Dates & Scheduling
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
  },
  expiryDate: Date,
  reviewDate: {
    type: Date,
    required: [true, 'Review date is required'],
  },
  lastReviewDate: Date,
  
  // Distribution & Acknowledgment
  targetAudience: {
    departments: [{
      type: String,
      trim: true,
    }],
    roles: [{
      type: String,
      enum: ['admin', 'manager', 'employee', 'contractor', 'all'],
    }],
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    allUsers: {
      type: Boolean,
      default: false,
    },
  },
  
  acknowledgmentRequired: {
    type: Boolean,
    default: true,
  },
  acknowledgmentDeadline: Date,
  
  // Acknowledgment Tracking
  acknowledgments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
    userAgent: String,
    digitalSignature: String,
  }],
  
  // Training Association
  associatedTraining: [{
    trainingModule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingModule',
    },
    mandatory: {
      type: Boolean,
      default: false,
    },
  }],
  
  // File Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Analytics & Metrics
  metrics: {
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    acknowledgmentRate: {
      type: Number,
      default: 0,
    },
    averageReadTime: Number,
  },
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['created', 'updated', 'approval_required', 'approved', 'expired', 'review_due'],
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now,
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  }],
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
policySchema.index({ status: 1, category: 1 });
policySchema.index({ effectiveDate: 1, expiryDate: 1 });
policySchema.index({ 'targetAudience.departments': 1 });
policySchema.index({ 'targetAudience.roles': 1 });
policySchema.index({ createdAt: -1 });
policySchema.index({ title: 'text', description: 'text', content: 'text' });

// Virtual fields
policySchema.virtual('acknowledgmentProgress').get(function() {
  if (!this.acknowledgmentRequired) return 100;
  
  const totalTargeted = this.getTargetedUserCount();
  const acknowledged = this.acknowledgments.length;
  
  return totalTargeted > 0 ? Math.round((acknowledged / totalTargeted) * 100) : 0;
});

policySchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

policySchema.virtual('isReviewDue').get(function() {
  return this.reviewDate && this.reviewDate < new Date();
});

policySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Methods
policySchema.methods.getTargetedUserCount = async function() {
  const User = mongoose.model('User');
  let query = { isActive: true };
  
  if (this.targetAudience.allUsers) {
    const count = await User.countDocuments(query);
    return count;
  }
  
  let orConditions = [];
  
  if (this.targetAudience.departments.length > 0) {
    orConditions.push({ department: { $in: this.targetAudience.departments } });
  }
  
  if (this.targetAudience.roles.length > 0) {
    orConditions.push({ role: { $in: this.targetAudience.roles } });
  }
  
  if (this.targetAudience.specificUsers.length > 0) {
    orConditions.push({ _id: { $in: this.targetAudience.specificUsers } });
  }
  
  if (orConditions.length > 0) {
    query.$or = orConditions;
    const count = await User.countDocuments(query);
    return count;
  }
  
  return 0;
};

policySchema.methods.hasUserAcknowledged = function(userId) {
  return this.acknowledgments.some(ack => ack.user.toString() === userId.toString());
};

policySchema.methods.addAcknowledgment = async function(userId, ipAddress, userAgent) {
  if (this.hasUserAcknowledged(userId)) {
    throw new Error('User has already acknowledged this policy');
  }
  
  this.acknowledgments.push({
    user: userId,
    acknowledgedAt: new Date(),
    ipAddress,
    userAgent,
  });
  
  // Update acknowledgment rate
  const targetedCount = await this.getTargetedUserCount();
  this.metrics.acknowledgmentRate = targetedCount > 0 
    ? Math.round((this.acknowledgments.length / targetedCount) * 100) 
    : 0;
  
  return this.save();
};

policySchema.methods.incrementViews = async function() {
  this.metrics.views += 1;
  return this.save();
};

policySchema.methods.incrementDownloads = async function() {
  this.metrics.downloads += 1;
  return this.save();
};

policySchema.methods.createNewVersion = async function(updatedContent, updatedBy, changeLog) {
  // Save current version to history
  this.previousVersions.push({
    version: this.version,
    content: this.content,
    updatedBy: this.updatedBy || this.createdBy,
    updatedAt: this.updatedAt,
    changeLog: changeLog || 'Version update'
  });
  
  // Update to new version
  const versionParts = this.version.split('.');
  const majorVersion = parseInt(versionParts[0]);
  const minorVersion = parseInt(versionParts[1]) + 1;
  
  this.version = `${majorVersion}.${minorVersion}`;
  this.content = updatedContent;
  this.updatedBy = updatedBy;
  this.status = 'review'; // Reset to review status
  
  // Clear previous acknowledgments for new version
  this.acknowledgments = [];
  this.metrics.acknowledgmentRate = 0;
  
  return this.save();
};

// Static methods
policySchema.statics.getActiveOlicies = function() {
  return this.find({ 
    status: 'published',
    effectiveDate: { $lte: new Date() },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gt: new Date() } }
    ]
  });
};

policySchema.statics.getPoliciesForUser = function(userId, userDepartment, userRole) {
  return this.find({
    status: 'published',
    effectiveDate: { $lte: new Date() },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gt: new Date() } }
    ],
    $or: [
      { 'targetAudience.allUsers': true },
      { 'targetAudience.departments': userDepartment },
      { 'targetAudience.roles': userRole },
      { 'targetAudience.specificUsers': userId }
    ]
  });
};

policySchema.statics.getExpiredPolicies = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: { $ne: 'archived' }
  });
};

policySchema.statics.getPoliciesNeedingReview = function() {
  return this.find({
    reviewDate: { $lt: new Date() },
    status: 'published'
  });
};

module.exports = mongoose.model('Policy', policySchema);