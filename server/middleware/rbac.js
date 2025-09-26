// Enhanced RBAC Middleware (Non-Breaking Addition)
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Enhanced token verification with RBAC capabilities
const authenticateEnhanced = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data to ensure up-to-date permissions
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Attach enhanced user info to request
    req.user = {
      ...decoded,
      // Ensure fresh permissions
      permissions: user.getEffectivePermissions(),
      canAccessAdmin: user.canAccessAdmin(),
      adminCapabilities: user.adminCapabilities || []
    };
    
    next();
  } catch (error) {
    console.error('Enhanced auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has the specific permission
    if (req.user.permissions.includes(permission)) {
      return next();
    }

    // Admin bypass for critical operations
    if (req.user.role === 'admin' && permission.startsWith('policy.')) {
      return next();
    }

    return res.status(403).json({ 
      error: `Insufficient permissions. Required: ${permission}`,
      userPermissions: req.user.permissions 
    });
  };
};

// Admin access requirement (flexible)
const requireAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.canAccessAdmin) {
    return next();
  }

  return res.status(403).json({ 
    error: 'Admin access required',
    accessLevel: req.user.accessLevel,
    role: req.user.role 
  });
};

// Department-based authorization
const requireDepartmentAccess = (departments) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin can access all departments
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user's department is in allowed list
    const allowedDepts = Array.isArray(departments) ? departments : [departments];
    
    if (allowedDepts.includes(req.user.department) || allowedDepts.includes('all')) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Department access denied',
      requiredDepartments: allowedDepts,
      userDepartment: req.user.department 
    });
  };
};

// Flexible role and permission checker
const requireAny = (options) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { roles = [], permissions = [], accessLevel = 1 } = options;

    // Check role
    if (roles.length > 0 && roles.includes(req.user.role)) {
      return next();
    }

    // Check permissions
    if (permissions.length > 0 && permissions.some(perm => req.user.permissions.includes(perm))) {
      return next();
    }

    // Check access level
    if (req.user.accessLevel >= accessLevel) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Insufficient access',
      required: options,
      userAccess: {
        role: req.user.role,
        permissions: req.user.permissions,
        accessLevel: req.user.accessLevel
      }
    });
  };
};

module.exports = {
  authenticateEnhanced,
  requirePermission,
  requireAdminAccess,
  requireDepartmentAccess,
  requireAny
};