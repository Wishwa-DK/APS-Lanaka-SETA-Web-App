const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auditLogger = require('../middleware/auditLogger');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes working!' });
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced for development)
  max: process.env.AUTH_RATE_LIMIT_MAX || 15, // Increased from 5 to 15
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 5 * 60 // 5 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('employeeId')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters'),
  body('department')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Department must be between 2 and 50 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
];

// Register endpoint
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password, firstName, lastName, employeeId, department, position } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or employee ID already exists' 
      });
    }

    // Check if this is the designated admin account
    const isAdminAccount = employeeId === 'ADM001' && email === 'admin@apslanka.com';

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      employeeId,
      department,
      position: position || '',
      role: isAdminAccount ? 'admin' : 'employee'
    });

    // Log admin creation
    if (isAdminAccount) {
      console.log(`🔐 Admin account registered: ${email} (${employeeId})`);
    } else {
      console.log(`👤 Employee account registered: ${email} (${employeeId})`);
    }

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        department: user.department,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employee Login endpoint (blocks admin)
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip;

    // Block admin from using employee login
    if (email === 'admin@apslanka.com') {
      return res.status(403).json({ 
        error: 'Admin accounts must use Admin Portal Access' 
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email, isActive: true }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Additional check - block any admin role users
    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Admin accounts must use Admin Portal Access' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({ 
        error: 'Account is temporarily locked due to too many failed login attempts' 
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      // Log failed login attempt
      await user.addLoginHistory(ipAddress, userAgent, false);
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login and add to login history
    user.lastLogin = new Date();
    await user.addLoginHistory(ipAddress, userAgent, true);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        employeeId: user.employeeId,
        department: user.department,
        role: user.role,
        lastLogin: user.lastLogin,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Login endpoint (only for ADM001)
router.post('/admin-login', authLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip;

    // Only allow admin@apslanka.com
    if (email !== 'admin@apslanka.com') {
      return res.status(403).json({ 
        error: 'Unauthorized access to admin portal' 
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ 
      email: 'admin@apslanka.com', 
      employeeId: 'ADM001',
      isActive: true 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Ensure user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Account does not have admin privileges' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({ 
        error: 'Admin account is temporarily locked due to too many failed login attempts' 
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      // Log failed login attempt
      await user.addLoginHistory(ipAddress, userAgent, false);
      
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login and add to login history
    user.lastLogin = new Date();
    await user.addLoginHistory(ipAddress, userAgent, true);

    console.log(`🔐 Admin login successful: ${user.email} (${user.employeeId})`);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        employeeId: user.employeeId,
        department: user.department,
        role: user.role,
        lastLogin: user.lastLogin,
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('manager', 'firstName lastName email employeeId')
      .select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      employeeId: user.employeeId,
      department: user.department,
      position: user.position,
      role: user.role,
      manager: user.manager,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      riskScore: user.riskScore,
      complianceScore: user.complianceScore,
      notificationPreferences: user.notificationPreferences,
      trainingProgress: user.trainingProgress,
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Department must be between 2 and 50 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
], auditLogger, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { firstName, lastName, department, position, notificationPreferences } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (department) updateData.department = department;
    if (position) updateData.position = position;
    if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        role: user.role,
        notificationPreferences: user.notificationPreferences,
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
], auditLogger, async (req, res) => {
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
    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all users
router.get('/users', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      department = '', 
      role = '',
      isActive 
    } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'manager', select: 'firstName lastName email employeeId' }
      ],
      select: '-password -passwordResetToken -emailVerificationToken'
    };

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.paginate(query, options);

    res.json({
      users: users.docs,
      pagination: {
        total: users.totalDocs,
        page: users.page,
        limit: users.limit,
        totalPages: users.totalPages,
        hasNextPage: users.hasNextPage,
        hasPrevPage: users.hasPrevPage
      }
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update user role
router.put('/users/:id/role', authenticateToken, authorizeRole(['admin']), [
  body('role')
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role must be admin, manager, or employee'),
], auditLogger, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Toggle user active status
router.put('/users/:id/status', authenticateToken, authorizeRole(['admin']), auditLogger, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics (admin only)
router.get('/stats', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const usersByDepartment = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const recentLogins = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        recentLogins
      },
      byRole: usersByRole,
      byDepartment: usersByDepartment
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Unified Login Endpoint (Non-Breaking Addition)
router.post('/unified-login', authLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip;

    // Find user (admin OR employee)
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({ 
        error: 'Account is temporarily locked due to too many failed login attempts' 
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Add to login history
    await user.addLoginHistory(ipAddress, userAgent, true);

    // Generate enhanced JWT token with all capabilities
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      // Enhanced RBAC fields
      accessLevel: user.accessLevel || 1,
      permissions: user.getEffectivePermissions(),
      canAccessAdmin: user.canAccessAdmin(),
      adminCapabilities: user.adminCapabilities || []
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Log successful login with enhanced info
    await auditLogger(req, 'LOGIN', `Unified login successful for ${user.role}`, {
      userId: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
      accessLevel: user.accessLevel,
      adminAccess: user.canAccessAdmin()
    });

    console.log(`🔐 Unified Login: ${user.firstName} ${user.lastName} (${user.role}) - Admin Access: ${user.canAccessAdmin()}`);

    // Return comprehensive user info
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        lastLogin: user.lastLogin,
        // Enhanced RBAC info
        accessLevel: user.accessLevel || 1,
        canAccessAdmin: user.canAccessAdmin(),
        permissions: user.getEffectivePermissions(),
        adminCapabilities: user.adminCapabilities || []
      },
      // UI Guidance
      redirectTo: user.canAccessAdmin() ? '/admin' : '/employee',
      capabilities: {
        canCreatePolicies: user.hasPermission('policy.create') || user.role === 'admin',
        canManageUsers: user.hasPermission('user.edit') || user.role === 'admin',
        canViewReports: user.hasPermission('reports.generate') || user.role === 'admin',
        canAccessAudit: user.hasPermission('audit.view') || user.role === 'admin'
      }
    });

  } catch (error) {
    console.error('Unified login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;