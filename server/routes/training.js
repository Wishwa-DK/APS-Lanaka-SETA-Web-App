const express = require('express');
const router = express.Router();
const TrainingModule = require('../models/TrainingModule');
const User = require('../models/User');
const auth = require('../middleware/authSimple');
const auditLogger = require('../middleware/auditLogger');

// GET /api/training - Get all training modules
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, difficulty } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch training modules with pagination
    const modules = await TrainingModule.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await TrainingModule.countDocuments(filter);
    
    res.json({
      success: true,
      data: modules,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + modules.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching training modules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching training modules',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/training/:id - Get specific training module
router.get('/:id', auth, async (req, res) => {
  try {
    const module = await TrainingModule.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('prerequisites', 'title');
      
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Training module not found'
      });
    }
    
    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Error fetching training module:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching training module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/training - Create new training module (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user has permission to create training
    if (req.user.role !== 'admin' && !req.user.permissions.includes('create_training')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create training modules'
      });
    }
    
    const moduleData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const module = new TrainingModule(moduleData);
    await module.save();
    
    await module.populate('createdBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      message: 'Training module created successfully',
      data: module
    });
  } catch (error) {
    console.error('Error creating training module:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating training module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/training/:id - Update training module
router.put('/:id', auth, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'admin' && !req.user.permissions.includes('manage_training')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update training modules'
      });
    }
    
    const module = await TrainingModule.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Training module not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Training module updated successfully',
      data: module
    });
  } catch (error) {
    console.error('Error updating training module:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating training module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/training/:id - Delete training module
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'admin' && !req.user.permissions.includes('manage_training')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete training modules'
      });
    }
    
    const module = await TrainingModule.findByIdAndDelete(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Training module not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Training module deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training module:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting training module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/training/:id/enroll - Enroll user in training
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const module = await TrainingModule.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Training module not found'
      });
    }
    
    // Check if user is already enrolled
    const user = await User.findById(req.user._id);
    const existingProgress = user.trainingProgress.find(
      progress => progress.moduleId.toString() === req.params.id
    );
    
    if (existingProgress) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this training module'
      });
    }
    
    // Add training progress entry
    user.trainingProgress.push({
      moduleId: req.params.id,
      startedAt: new Date(),
      status: 'in-progress',
      progress: 0
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Successfully enrolled in training module'
    });
  } catch (error) {
    console.error('Error enrolling in training:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in training',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/training/:id/progress - Update training progress
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const { progress, completed = false } = req.body;
    
    const user = await User.findById(req.user._id);
    const trainingProgress = user.trainingProgress.find(
      p => p.moduleId.toString() === req.params.id
    );
    
    if (!trainingProgress) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this training module'
      });
    }
    
    // Update progress
    trainingProgress.progress = Math.max(trainingProgress.progress, progress);
    
    if (completed) {
      trainingProgress.status = 'completed';
      trainingProgress.completedAt = new Date();
      trainingProgress.progress = 100;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Training progress updated successfully',
      data: trainingProgress
    });
  } catch (error) {
    console.error('Error updating training progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating training progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/training/user/progress - Get user's training progress
router.get('/user/progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('trainingProgress.moduleId', 'title description category difficulty estimatedDuration');
    
    res.json({
      success: true,
      data: user.trainingProgress || []
    });
  } catch (error) {
    console.error('Error fetching training progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching training progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;