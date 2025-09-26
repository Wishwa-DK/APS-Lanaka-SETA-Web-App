const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const PolicyAcknowledgment = require('../models/PolicyAcknowledgment');
// Validation removed per user request
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Debug endpoint to see all policies in database (for troubleshooting)
router.get('/debug/all', async (req, res) => {
  try {
    const policies = await Policy.find({})
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .select('-__v');
    
    console.log(`Debug: Found ${policies.length} total policies in database`);
    res.json(policies);
  } catch (error) {
    console.error('Error fetching all policies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get policies filtered by user's department and role
router.get('/', async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Audit log
    console.log(`Policy view by user: ${user.userId} (${user.email}) - ${user.department}/${user.role}`);
    
    let query = { status: 'published' }; // Only show published policies
    
    // Admin can see all policies
    if (user.role === 'admin') {
      query = { status: { $ne: 'deleted' } }; // Admin sees all except deleted
    } else {
      // For regular users, filter by department and role
      query = {
        ...query,
        $or: [
          // Policies for all users
          { 'targetAudience.allUsers': true },
          // Policies for user's department (array field)
          { 'targetAudience.departments': { $in: [user.department] } },
          // Policies for user's role (array field)
          { 'targetAudience.roles': { $in: [user.role] } },
          // Policies specifically for this user (array field)
          { 'targetAudience.specificUsers': { $in: [user.userId] } }
        ]
      };
    }

    const policies = await Policy.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .select('-__v');

    // Add acknowledgment status for each policy
    const policiesWithStatus = await Promise.all(policies.map(async (policy) => {
      let userAcknowledgmentData = {
        userAcknowledged: false,
        acknowledgmentPercentage: 0,
        hasViewed: false,
        hasDownloaded: false,
        isFullyAcknowledged: false,
        acknowledgmentStatus: 'not_started'
      };

      // For non-admin users, get their acknowledgment data
      if (user.role !== 'admin') {
        const acknowledgment = await PolicyAcknowledgment.findOne({ 
          policy: policy._id, 
          user: user.userId 
        });

        if (acknowledgment) {
          userAcknowledgmentData = {
            userAcknowledged: acknowledgment.acknowledgmentPercentage > 0,
            acknowledgmentPercentage: acknowledgment.acknowledgmentPercentage,
            hasViewed: acknowledgment.hasViewed,
            hasDownloaded: acknowledgment.hasDownloaded,
            isFullyAcknowledged: acknowledgment.isFullyAcknowledged,
            acknowledgmentStatus: acknowledgment.acknowledgmentStatus
          };
        }
      }

      // Legacy acknowledgment check for backward compatibility
      const legacyAcknowledged = policy.acknowledgments.some(ack => 
        ack.user.toString() === user.userId
      );
      
      return {
        ...policy.toObject(),
        userAcknowledged: userAcknowledgmentData.userAcknowledged || legacyAcknowledged,
        acknowledgmentCount: policy.acknowledgments.length,
        ...userAcknowledgmentData
      };
    }));

    // RBAC Debug Logging
    console.log(`📊 RBAC Result for ${user.email} (${user.department}/${user.role}):`);
    console.log(`   Query used: ${JSON.stringify(query)}`);
    console.log(`   Found ${policiesWithStatus.length} policies:`);
    policiesWithStatus.forEach(policy => {
      const depts = policy.targetAudience?.departments || [];
      console.log(`   - ${policy.title} (target: ${depts.join(',') || 'all users'})`);
    });

    res.json(policiesWithStatus);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Create new policy
router.post('/', async (req, res) => {
    try {
      const user = req.user;
      console.log(`📝 Creating policy - User: ${user.email} (${user.role})`);
      
      const { 
        title, 
        description, 
        content, 
        category, 
        priority = 'medium',
        targetAudience,
        acknowledgmentRequired = true
      } = req.body;

      const policy = new Policy({
        title,
        description,
        content,
        category,
        priority,
        version: '1.0',
        status: 'published', // Directly publish for real use
        createdBy: user.userId,
        approvedBy: user.userId, // Admin auto-approves
        effectiveDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        targetAudience: {
          departments: targetAudience?.departments || [],
          roles: targetAudience?.roles || [],
          specificUsers: targetAudience?.specificUsers || [],
          allUsers: targetAudience?.allUsers || false
        },
        acknowledgmentRequired
      });

      const savedPolicy = await policy.save();
      
      // Populate creator info for response
      await savedPolicy.populate('createdBy', 'firstName lastName email');
      await savedPolicy.populate('approvedBy', 'firstName lastName email');

      // Audit log
      console.log(`Policy created: "${title}" by ${user.email} - targeting:`, targetAudience);

      res.status(201).json(savedPolicy);
    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({ error: 'Failed to create policy' });
    }
  }
);

// Acknowledge policy
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const user = req.user;
    const policyId = req.params.id;

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Check if user already acknowledged
    const existingAck = policy.acknowledgments.find(ack => 
      ack.user.toString() === user.userId
    );

    if (existingAck) {
      return res.status(400).json({ error: 'Policy already acknowledged' });
    }

    // Add acknowledgment
    policy.acknowledgments.push({
      user: user.userId,
      acknowledgedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || ''
    });

    await policy.save();

    // Audit log
    console.log(`Policy acknowledged: "${policy.title}" by ${user.email}`);

    res.json({ message: 'Policy acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    res.status(500).json({ error: 'Failed to acknowledge policy' });
  }
});

// Get policy by ID
router.get('/:id', async (req, res) => {
  try {
    const user = req.user;
    const policyId = req.params.id;

    const policy = await Policy.findById(policyId)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Check if user has access to this policy
    if (user.role !== 'admin') {
      const hasAccess = policy.targetAudience.allUsers ||
        policy.targetAudience.departments.includes(user.department) ||
        policy.targetAudience.roles.includes(user.role) ||
        policy.targetAudience.specificUsers.includes(user.userId);

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check acknowledgment status
    const acknowledged = policy.acknowledgments.some(ack => 
      ack.user.toString() === user.userId
    );

    res.json({
      ...policy.toObject(),
      userAcknowledged: acknowledged,
      acknowledgmentCount: policy.acknowledgments.length
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// Update policy (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const user = req.user;
    const policyId = req.params.id;
    
    // Admin check
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`📝 Updating policy ${policyId} - User: ${user.email} (${user.role})`);
    
    const { 
      title, 
      description, 
      content, 
      category, 
      priority = 'medium',
      targetAudience,
      acknowledgmentRequired = true
    } = req.body;

    // Find and update the policy
    const updatedPolicy = await Policy.findByIdAndUpdate(
      policyId,
      {
        title,
        description,
        content,
        category,
        priority,
        targetAudience: {
          departments: targetAudience?.departments || [],
          roles: targetAudience?.roles || [],
          specificUsers: targetAudience?.specificUsers || [],
          allUsers: targetAudience?.allUsers || false
        },
        acknowledgmentRequired,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('approvedBy', 'firstName lastName email');

    if (!updatedPolicy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Audit log
    console.log(`Policy updated: "${title}" by ${user.email} - targeting:`, targetAudience);

    res.json(updatedPolicy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

// Delete policy (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = req.user;
    const policyId = req.params.id;
    
    // Admin check
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`🗑️ Deleting policy ${policyId} - User: ${user.email} (${user.role})`);
    
    const policy = await Policy.findById(policyId);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Actually delete the policy from database
    await Policy.findByIdAndDelete(policyId);

    // Audit log
    console.log(`Policy deleted: "${policy.title}" by ${user.email}`);

    res.json({ message: 'Policy deleted successfully', deletedPolicy: policy.title });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

// Track policy view (50% acknowledgment) - Production-ready with error handling
router.post('/:id/track-view', async (req, res) => {
  try {
    const policyId = req.params.id;
    const user = req.user;

    // Validate required data
    if (!policyId || !user || !user.userId) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Skip tracking for admin users
    if (user.role === 'admin') {
      return res.json({ 
        message: 'Admin view not tracked',
        acknowledgmentPercentage: 0
      });
    }

    // Find the policy with error handling
    let policy;
    try {
      policy = await Policy.findById(policyId);
    } catch (dbError) {
      console.error('Database error finding policy:', dbError);
      return res.status(503).json({ error: 'Database connection issue' });
    }
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Get or create acknowledgment record with error handling
    let acknowledgment;
    try {
      acknowledgment = await PolicyAcknowledgment.getOrCreate(
        policyId, 
        user.userId, 
        req.ip, 
        req.get('User-Agent') || ''
      );
    } catch (dbError) {
      console.error('Database error creating acknowledgment:', dbError);
      return res.status(503).json({ error: 'Failed to create acknowledgment record' });
    }

    // Update view status with error handling
    try {
      await acknowledgment.updateViewStatus();
    } catch (dbError) {
      console.error('Database error updating view status:', dbError);
      return res.status(503).json({ error: 'Failed to update view status' });
    }

    // Update policy metrics with error handling
    try {
      policy.metrics.views = (policy.metrics.views || 0) + 1;
      await policy.save();
    } catch (dbError) {
      console.error('Database error updating policy metrics:', dbError);
      // Don't fail the request if metrics update fails
    }

    console.log(`👀 Policy viewed: "${policy.title}" by ${user.email} - Acknowledgment: ${acknowledgment.acknowledgmentPercentage}%`);

    res.json({
      message: 'Policy view tracked successfully',
      acknowledgmentPercentage: acknowledgment.acknowledgmentPercentage,
      hasViewed: acknowledgment.hasViewed,
      hasDownloaded: acknowledgment.hasDownloaded,
      isFullyAcknowledged: acknowledgment.isFullyAcknowledged,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Critical error tracking policy view:', {
      error: error.message,
      stack: error.stack,
      policyId: req.params.id,
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Failed to track policy view',
      timestamp: new Date().toISOString()
    });
  }
});

// Track policy download (additional 50% acknowledgment) - Production-ready with error handling
router.post('/:id/track-download', async (req, res) => {
  try {
    const policyId = req.params.id;
    const user = req.user;

    // Validate required data
    if (!policyId || !user || !user.userId) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Skip tracking for admin users
    if (user.role === 'admin') {
      return res.json({ 
        message: 'Admin download not tracked',
        acknowledgmentPercentage: 0
      });
    }

    // Find the policy with error handling
    let policy;
    try {
      policy = await Policy.findById(policyId);
    } catch (dbError) {
      console.error('Database error finding policy:', dbError);
      return res.status(503).json({ error: 'Database connection issue' });
    }
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Get or create acknowledgment record with error handling
    let acknowledgment;
    try {
      acknowledgment = await PolicyAcknowledgment.getOrCreate(
        policyId, 
        user.userId, 
        req.ip, 
        req.get('User-Agent') || ''
      );
    } catch (dbError) {
      console.error('Database error creating acknowledgment:', dbError);
      return res.status(503).json({ error: 'Failed to create acknowledgment record' });
    }

    // Update download status with error handling
    try {
      await acknowledgment.updateDownloadStatus();
    } catch (dbError) {
      console.error('Database error updating download status:', dbError);
      return res.status(503).json({ error: 'Failed to update download status' });
    }

    // Update policy metrics with error handling
    try {
      policy.metrics.downloads = (policy.metrics.downloads || 0) + 1;
      await policy.save();
    } catch (dbError) {
      console.error('Database error updating policy metrics:', dbError);
      // Don't fail the request if metrics update fails
    }

    console.log(`📄 Policy downloaded: "${policy.title}" by ${user.email} - Acknowledgment: ${acknowledgment.acknowledgmentPercentage}%`);

    res.json({
      message: 'Policy download tracked successfully',
      acknowledgmentPercentage: acknowledgment.acknowledgmentPercentage,
      hasViewed: acknowledgment.hasViewed,
      hasDownloaded: acknowledgment.hasDownloaded,
      isFullyAcknowledged: acknowledgment.isFullyAcknowledged,
      policyTitle: policy.title,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Critical error tracking policy download:', {
      error: error.message,
      stack: error.stack,
      policyId: req.params.id,
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Failed to track policy download',
      timestamp: new Date().toISOString()
    });
  }
});

// Get user's acknowledgment status for all policies
router.get('/acknowledgments/my-status', async (req, res) => {
  try {
    const user = req.user;

    // Skip for admin users
    if (user.role === 'admin') {
      return res.json({ 
        acknowledgments: [],
        summary: {
          totalPolicies: 0,
          fullyAcknowledged: 0,
          partiallyAcknowledged: 0,
          notStarted: 0,
          avgAcknowledgmentPercentage: 100
        }
      });
    }

    // Get user's acknowledgments with policy details
    const acknowledgments = await PolicyAcknowledgment.find({ user: user.userId })
      .populate('policy', 'title description category status')
      .sort({ updatedAt: -1 });

    // Get summary statistics
    const summary = await PolicyAcknowledgment.getUserAcknowledgmentSummary(user.userId);

    res.json({
      acknowledgments: acknowledgments.map(ack => ({
        policyId: ack.policy._id,
        policyTitle: ack.policy.title,
        policyCategory: ack.policy.category,
        acknowledgmentPercentage: ack.acknowledgmentPercentage,
        hasViewed: ack.hasViewed,
        hasDownloaded: ack.hasDownloaded,
        isFullyAcknowledged: ack.isFullyAcknowledged,
        acknowledgmentStatus: ack.acknowledgmentStatus,
        lastViewedAt: ack.lastViewedAt,
        downloadedAt: ack.downloadedAt,
        viewCount: ack.viewCount,
        downloadCount: ack.downloadCount
      })),
      summary
    });

  } catch (error) {
    console.error('Error fetching acknowledgment status:', error);
    res.status(500).json({ error: 'Failed to fetch acknowledgment status' });
  }
});

// Get policy acknowledgment statistics (Admin only)
router.get('/:id/acknowledgment-stats', async (req, res) => {
  try {
    const user = req.user;
    const policyId = req.params.id;

    // Admin check
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get policy statistics
    const stats = await PolicyAcknowledgment.getPolicyStats(policyId);
    
    // Get policy details
    const policy = await Policy.findById(policyId).select('title description category');
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({
      policy: {
        id: policy._id,
        title: policy.title,
        description: policy.description,
        category: policy.category
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching policy acknowledgment stats:', error);
    res.status(500).json({ error: 'Failed to fetch acknowledgment statistics' });
  }
});

module.exports = router;