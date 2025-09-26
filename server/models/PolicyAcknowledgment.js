const mongoose = require('mongoose');

const policyAcknowledgmentSchema = new mongoose.Schema({
  // References
  policy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Acknowledgment Progress Tracking
  hasViewed: {
    type: Boolean,
    default: false,
  },
  hasDownloaded: {
    type: Boolean,
    default: false,
  },
  acknowledgmentPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  
  // Interaction Timestamps
  firstViewedAt: {
    type: Date,
    default: null,
  },
  lastViewedAt: {
    type: Date,
    default: null,
  },
  downloadedAt: {
    type: Date,
    default: null,
  },
  
  // View Tracking
  viewCount: {
    type: Number,
    default: 0,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  
  // Audit Information
  ipAddress: String,
  userAgent: String,
  
  // Manual Acknowledgment (for future use)
  manuallyAcknowledged: {
    type: Boolean,
    default: false,
  },
  acknowledgedAt: {
    type: Date,
    default: null,
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for performance
policyAcknowledgmentSchema.index({ policy: 1, user: 1 }, { unique: true });
policyAcknowledgmentSchema.index({ user: 1, acknowledgmentPercentage: 1 });
policyAcknowledgmentSchema.index({ policy: 1, acknowledgmentPercentage: 1 });

// Virtual to calculate acknowledgment status
policyAcknowledgmentSchema.virtual('isFullyAcknowledged').get(function() {
  return this.acknowledgmentPercentage === 100;
});

// Virtual to get acknowledgment status text
policyAcknowledgmentSchema.virtual('acknowledgmentStatus').get(function() {
  if (this.acknowledgmentPercentage === 100) return 'completed';
  if (this.acknowledgmentPercentage === 50) return 'partial';
  return 'not_started';
});

// Methods to update acknowledgment progress
policyAcknowledgmentSchema.methods.updateViewStatus = function() {
  if (!this.hasViewed) {
    this.hasViewed = true;
    this.firstViewedAt = new Date();
    this.viewCount = 1;
    this.acknowledgmentPercentage = 50;
  } else {
    this.viewCount += 1;
  }
  this.lastViewedAt = new Date();
  return this.save();
};

policyAcknowledgmentSchema.methods.updateDownloadStatus = function() {
  if (!this.hasDownloaded) {
    this.hasDownloaded = true;
    this.downloadedAt = new Date();
    this.downloadCount = 1;
    
    // If already viewed, set to 100%, otherwise set to 50% (download without view)
    this.acknowledgmentPercentage = this.hasViewed ? 100 : 50;
    
    // If not viewed yet, mark as viewed too
    if (!this.hasViewed) {
      this.hasViewed = true;
      this.firstViewedAt = new Date();
      this.lastViewedAt = new Date();
      this.viewCount = 1;
    }
  } else {
    this.downloadCount += 1;
  }
  
  return this.save();
};

// Static method to get or create acknowledgment record
policyAcknowledgmentSchema.statics.getOrCreate = async function(policyId, userId, ipAddress, userAgent) {
  let acknowledgment = await this.findOne({ policy: policyId, user: userId });
  
  if (!acknowledgment) {
    acknowledgment = new this({
      policy: policyId,
      user: userId,
      ipAddress,
      userAgent,
    });
    await acknowledgment.save();
  }
  
  return acknowledgment;
};

// Static method to get policy acknowledgment statistics
policyAcknowledgmentSchema.statics.getPolicyStats = async function(policyId) {
  const stats = await this.aggregate([
    { $match: { policy: new mongoose.Types.ObjectId(policyId) } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        viewedCount: { $sum: { $cond: ['$hasViewed', 1, 0] } },
        downloadedCount: { $sum: { $cond: ['$hasDownloaded', 1, 0] } },
        fullyAcknowledged: { $sum: { $cond: [{ $eq: ['$acknowledgmentPercentage', 100] }, 1, 0] } },
        partiallyAcknowledged: { $sum: { $cond: [{ $eq: ['$acknowledgmentPercentage', 50] }, 1, 0] } },
        avgAcknowledgmentPercentage: { $avg: '$acknowledgmentPercentage' },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' },
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalUsers: 0,
    viewedCount: 0,
    downloadedCount: 0,
    fullyAcknowledged: 0,
    partiallyAcknowledged: 0,
    avgAcknowledgmentPercentage: 0,
    totalViews: 0,
    totalDownloads: 0,
  };
};

// Static method to get user acknowledgment summary
policyAcknowledgmentSchema.statics.getUserAcknowledgmentSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalPolicies: { $sum: 1 },
        fullyAcknowledged: { $sum: { $cond: [{ $eq: ['$acknowledgmentPercentage', 100] }, 1, 0] } },
        partiallyAcknowledged: { $sum: { $cond: [{ $eq: ['$acknowledgmentPercentage', 50] }, 1, 0] } },
        notStarted: { $sum: { $cond: [{ $eq: ['$acknowledgmentPercentage', 0] }, 1, 0] } },
        avgAcknowledgmentPercentage: { $avg: '$acknowledgmentPercentage' },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' },
      }
    }
  ]);
  
  return summary.length > 0 ? summary[0] : {
    totalPolicies: 0,
    fullyAcknowledged: 0,
    partiallyAcknowledged: 0,
    notStarted: 0,
    avgAcknowledgmentPercentage: 0,
    totalViews: 0,
    totalDownloads: 0,
  };
};

module.exports = mongoose.model('PolicyAcknowledgment', policyAcknowledgmentSchema);