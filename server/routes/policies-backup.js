const express = require('express')
const router = express.Router()
const Policy = require('../models/Policy')
const auditLogger = require('../middleware/auditLogger')
const { body, validationResult } = require('express-validator')
const multer = require('multer')
const path = require('path')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/policies/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and image files are allowed'), false)
    }
  }
})

// Get policies filtered by user's department and role
router.get('/', async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Audit log
    console.log(`Policy view by user: ${user.id} (${user.email}) - ${user.department}/${user.role}`);
    
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
          // Policies for user's department
          { 'targetAudience.departments': user.department },
          // Policies for user's role
          { 'targetAudience.roles': user.role },
          // Policies specifically for this user
          { 'targetAudience.specificUsers': user.id }
        ]
      };
    }

    const policies = await Policy.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .select('-__v');

    // Add acknowledgment status for each policy
    const policiesWithStatus = policies.map(policy => {
      const acknowledged = policy.acknowledgments.some(ack => 
        ack.user.toString() === user.id
      );
      
      return {
        ...policy.toObject(),
        userAcknowledged: acknowledged,
        acknowledgmentCount: policy.acknowledgments.length
      };
    });

    res.json(policiesWithStatus);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Get policy by ID
router.get('/:id', auditLogger, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
    
    if (!policy || policy.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      })
    }

    res.json({
      success: true,
      data: policy
    })
  } catch (error) {
    console.error('Error fetching policy:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy'
    })
  }
})

// Create new policy (Admin only)
router.post('/', 
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
    body('content').trim().isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
    body('category').isIn(['Security', 'Privacy', 'Training', 'Compliance', 'General']).withMessage('Invalid category')
  ],
  auditLogger,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        })
      }

      const { title, description, content, category } = req.body

      const policy = new Policy({
        title,
        description,
        content,
        category,
        version: '1.0',
        createdBy: req.user.id,
        status: 'draft'
      })

      await policy.save()

      res.status(201).json({
        success: true,
        message: 'Policy created successfully',
        data: policy
      })
    } catch (error) {
      console.error('Error creating policy:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create policy'
      })
    }
  }
)

// Update policy (Admin only)
router.put('/:id',
  [
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().trim().isLength({ min: 10, max: 500 }),
    body('content').optional().trim().isLength({ min: 50 }),
    body('category').optional().isIn(['Security', 'Privacy', 'Training', 'Compliance', 'General'])
  ],
  auditLogger,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        })
      }

      const policy = await Policy.findById(req.params.id)
      if (!policy || policy.status === 'deleted') {
        return res.status(404).json({
          success: false,
          message: 'Policy not found'
        })
      }

      // Update version if content changed
      if (req.body.content && req.body.content !== policy.content) {
        const versionNumber = parseFloat(policy.version) + 0.1
        policy.version = versionNumber.toFixed(1)
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          policy[key] = req.body[key]
        }
      })

      policy.updatedBy = req.user.id
      await policy.save()

      res.json({
        success: true,
        message: 'Policy updated successfully',
        data: policy
      })
    } catch (error) {
      console.error('Error updating policy:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update policy'
      })
    }
  }
)

// Delete policy (Admin only)
router.delete('/:id', auditLogger, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    const policy = await Policy.findById(req.params.id)
    if (!policy || policy.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      })
    }

    // Soft delete
    policy.status = 'deleted'
    policy.updatedBy = req.user.id
    await policy.save()

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting policy:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete policy'
    })
  }
})

// Acknowledge policy
router.post('/:id/acknowledge', auditLogger, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
    if (!policy || policy.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Policy not found or not active'
      })
    }

    // Check if user already acknowledged this version
    const existingAck = policy.acknowledgments.find(
      ack => ack.userId.toString() === req.user.id && ack.version === policy.version
    )

    if (existingAck) {
      return res.status(400).json({
        success: false,
        message: 'Policy already acknowledged'
      })
    }

    // Add acknowledgment
    policy.acknowledgments.push({
      userId: req.user.id,
      version: policy.version,
      acknowledgedAt: new Date()
    })

    await policy.save()

    res.json({
      success: true,
      message: 'Policy acknowledged successfully'
    })
  } catch (error) {
    console.error('Error acknowledging policy:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge policy'
    })
  }
})

// Upload policy document
router.post('/:id/upload', 
  upload.single('document'),
  auditLogger,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      const policy = await Policy.findById(req.params.id)
      if (!policy) {
        return res.status(404).json({
          success: false,
          message: 'Policy not found'
        })
      }

      policy.attachments.push({
        filename: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user.id
      })

      await policy.save()

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          filename: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error) {
      console.error('Error uploading document:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to upload document'
      })
    }
  }
)

// Get policy statistics (Admin only)
router.get('/stats/overview', auditLogger, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    const totalPolicies = await Policy.countDocuments({ status: { $ne: 'deleted' } })
    const activePolicies = await Policy.countDocuments({ status: 'active' })
    const draftPolicies = await Policy.countDocuments({ status: 'draft' })

    // Get acknowledgment statistics
    const policies = await Policy.find({ status: 'active' })
    let totalAcknowledgments = 0
    let requiredAcknowledgments = 0

    policies.forEach(policy => {
      totalAcknowledgments += policy.acknowledgments.length
      // Assuming we need all users to acknowledge (this could be more sophisticated)
      requiredAcknowledgments += 100 // This should be dynamic based on user count
    })

    const acknowledgmentRate = requiredAcknowledgments > 0 
      ? Math.round((totalAcknowledgments / requiredAcknowledgments) * 100)
      : 0

    res.json({
      success: true,
      data: {
        totalPolicies,
        activePolicies,
        draftPolicies,
        acknowledgmentRate,
        totalAcknowledgments
      }
    })
  } catch (error) {
    console.error('Error fetching policy statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    })
  }
})

module.exports = router