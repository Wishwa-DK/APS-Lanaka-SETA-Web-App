const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT', 
      'REGISTER',
      'PASSWORD_CHANGE',
      'PROFILE_UPDATE',
      'POLICY_VIEW',
      'POLICY_ACKNOWLEDGE',
      'TRAINING_START',
      'TRAINING_COMPLETE',
      'QUIZ_START',
      'QUIZ_COMPLETE',
      'FILE_UPLOAD',
      'FILE_DOWNLOAD',
      'ADMIN_ACCESS',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'POLICY_CREATE',
      'POLICY_UPDATE',
      'POLICY_DELETE',
      'SYSTEM_CONFIG',
      'SECURITY_INCIDENT',
      'DATA_EXPORT',
      'FAILED_LOGIN',
      'SUSPICIOUS_ACTIVITY'
    ]
  },
  resource: {
    type: String,
    required: false // The resource being accessed (e.g., 'users', 'policies', 'training')
  },
  resourceId: {
    type: String,
    required: false // ID of the specific resource
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false // Additional context/details about the action
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
})

// Indexes for performance
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })
auditLogSchema.index({ riskLevel: 1, timestamp: -1 })
auditLogSchema.index({ success: 1, timestamp: -1 })

// Static method to log an action
auditLogSchema.statics.logAction = async function(logData) {
  try {
    const auditLog = new this(logData)
    await auditLog.save()
    
    // For high/critical risk actions, you could add additional alerts here
    if (logData.riskLevel === 'HIGH' || logData.riskLevel === 'CRITICAL') {
      console.warn(`[SECURITY ALERT] ${logData.action} by user ${logData.userId}`)
    }
    
    return auditLog
  } catch (error) {
    console.error('Failed to create audit log:', error)
    throw error
  }
}

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('action resource timestamp success riskLevel')
}

// Static method to get security incidents
auditLogSchema.statics.getSecurityIncidents = async function(timeRange = 24) {
  const since = new Date(Date.now() - timeRange * 60 * 60 * 1000)
  
  return this.find({
    $or: [
      { riskLevel: { $in: ['HIGH', 'CRITICAL'] } },
      { success: false },
      { action: { $in: ['FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY', 'SECURITY_INCIDENT'] } }
    ],
    timestamp: { $gte: since }
  })
  .sort({ timestamp: -1 })
  .populate('userId', 'email role department')
}

// Static method for compliance reporting
auditLogSchema.statics.getComplianceReport = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id.date': -1, '_id.action': 1 }
    }
  ])
}

const AuditLog = mongoose.model('AuditLog', auditLogSchema)

module.exports = AuditLog