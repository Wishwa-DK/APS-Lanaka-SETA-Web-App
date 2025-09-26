const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for profile operations
const profileUpdateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 updates per 15 minutes per IP
  message: { error: 'Too many profile updates. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordChangeLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password changes per hour per IP
  message: { error: 'Too many password change attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF) are allowed'), false);
    }
  }
});

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('loginHistory', '-_id timestamp ipAddress userAgent')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add computed fields
    user.fullName = `${user.firstName} ${user.lastName}`;
    user.profileCompleteness = calculateProfileCompleteness(user);

    res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({ error: 'Server error while retrieving profile' });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile information
// @access  Private
router.put('/', [
  auth,
  profileUpdateLimit,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('phone')
      .optional()
      .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Please provide a valid date of birth'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    
    body('emergencyContact')
      .optional()
      .isObject()
      .withMessage('Emergency contact must be an object'),
    
    body('emergencyContact.name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Emergency contact name must be between 2 and 100 characters'),
    
    body('emergencyContact.phone')
      .optional()
      .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
      .withMessage('Emergency contact phone must be valid'),
    
    body('emergencyContact.relationship')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Relationship must be between 2 and 50 characters'),
    
    body('notificationPreferences')
      .optional()
      .isObject()
      .withMessage('Notification preferences must be an object')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.user.id }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email address is already in use' 
        });
      }
    }

    // Update allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 
      'address', 'emergencyContact', 'notificationPreferences'
    ];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        ...updates,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    // Log the profile update
    await logAuditEvent(req.user.id, 'profile_updated', {
      updatedFields: Object.keys(updates),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser.toObject(),
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        profileCompleteness: calculateProfileCompleteness(updatedUser)
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Email address is already in use' 
      });
    }
    
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

// @route   PUT /api/profile/password
// @desc    Change user password
// @access  Private
router.put('/password', [
  auth,
  passwordChangeLimit,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      })
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await logAuditEvent(req.user.id, 'password_change_failed', {
        reason: 'Invalid current password',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'New password must be different from current password' 
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      updatedAt: new Date()
    });

    // Log successful password change
    await logAuditEvent(req.user.id, 'password_changed', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Password changed successfully',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error while changing password' });
  }
});

// @route   POST /api/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/picture', [auth, profileUpdateLimit], (req, res) => {
  upload.single('profilePicture')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
        }
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        // Clean up uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove old profile picture if it exists
      if (user.profilePicture) {
        const oldPicturePath = path.join(__dirname, '../uploads/profile-pictures', user.profilePicture);
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
        }
      }

      // Update user with new profile picture
      const profilePictureFilename = req.file.filename;
      await User.findByIdAndUpdate(req.user.id, {
        profilePicture: profilePictureFilename,
        updatedAt: new Date()
      });

      // Log the profile picture upload
      await logAuditEvent(req.user.id, 'profile_picture_updated', {
        filename: profilePictureFilename,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        message: 'Profile picture uploaded successfully',
        profilePicture: profilePictureFilename,
        url: `/api/profile/picture/${profilePictureFilename}`
      });

    } catch (error) {
      console.error('Profile picture upload error:', error);
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Server error while uploading profile picture' });
    }
  });
});

// @route   GET /api/profile/picture/:filename
// @desc    Serve profile picture
// @access  Private
router.get('/picture/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/profile-pictures', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Profile picture retrieval error:', error);
    res.status(500).json({ error: 'Server error while retrieving profile picture' });
  }
});

// @route   DELETE /api/profile/picture
// @desc    Delete profile picture
// @access  Private
router.delete('/picture', [auth, profileUpdateLimit], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.profilePicture) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }

    // Remove profile picture file
    const picturePath = path.join(__dirname, '../uploads/profile-pictures', user.profilePicture);
    if (fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath);
    }

    // Update user record
    await User.findByIdAndUpdate(req.user.id, {
      profilePicture: null,
      updatedAt: new Date()
    });

    // Log the profile picture deletion
    await logAuditEvent(req.user.id, 'profile_picture_deleted', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    console.error('Profile picture deletion error:', error);
    res.status(500).json({ error: 'Server error while deleting profile picture' });
  }
});

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user) {
  const fields = [
    'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
    'address', 'emergencyContact', 'profilePicture'
  ];
  
  let completedFields = 0;
  
  fields.forEach(field => {
    if (field === 'emergencyContact') {
      if (user.emergencyContact && user.emergencyContact.name && user.emergencyContact.phone) {
        completedFields++;
      }
    } else if (user[field]) {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
}

// Helper function to log audit events
async function logAuditEvent(userId, action, details) {
  try {
    const AuditLog = require('../models/AuditLog');
    
    await AuditLog.create({
      userId,
      action,
      details,
      timestamp: new Date(),
      category: 'profile_management'
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error for audit logging failures
  }
}

module.exports = router;