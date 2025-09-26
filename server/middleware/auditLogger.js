const AuditLog = require('../models/AuditLog');

const auditLogger = async (req, res, next) => {
  // Store original res.json to capture response
  const originalJson = res.json;
  let responseBody = null;

  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Store request timestamp
  const startTime = Date.now();

  // Continue to next middleware
  next();

  // After response is sent, log the audit trail
  res.on('finish', async () => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Determine if this is a sensitive action that should be logged
      const sensitiveActions = [
        'POST', 'PUT', 'DELETE', 'PATCH'
      ];

      const sensitiveEndpoints = [
        '/api/auth',
        '/api/policies',
        '/api/training',
        '/api/compliance',
        '/api/risk',
        '/api/admin'
      ];

      const shouldLog = sensitiveActions.includes(req.method) || 
                       sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));

      if (shouldLog) {
        // Extract user information
        const userId = req.user ? req.user.userId : null;
        const userEmail = req.user ? req.user.email : null;
        const userRole = req.user ? req.user.role : null;

        // Prepare audit log data
        const auditData = {
          userId,
          userEmail,
          userRole,
          action: `${req.method} ${req.path}`,
          resource: req.path,
          method: req.method,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || '',
          requestBody: sanitizeRequestBody(req.body),
          responseStatus: res.statusCode,
          responseTime,
          timestamp: new Date(startTime),
          success: res.statusCode < 400,
          errorMessage: res.statusCode >= 400 ? responseBody?.error || 'Unknown error' : null,
          metadata: {
            query: req.query,
            params: req.params,
            headers: sanitizeHeaders(req.headers),
            sessionId: req.sessionID,
            referrer: req.get('Referrer') || '',
            origin: req.get('Origin') || '',
          }
        };

        // Create audit log entry
        const auditLog = new AuditLog(auditData);
        await auditLog.save();

        // Log to console for development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AUDIT] ${auditData.action} - ${auditData.responseStatus} - ${userEmail || 'Anonymous'}`);
        }
      }

    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw error to avoid breaking the application
    }
  });
};

// Helper function to sanitize request body (remove sensitive data)
function sanitizeRequestBody(body) {
  if (!body) return null;

  const sensitiveFields = [
    'password', 
    'newPassword', 
    'currentPassword', 
    'confirmPassword',
    'token',
    'secret',
    'key',
    'credential'
  ];

  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Helper function to sanitize headers (remove sensitive data)
function sanitizeHeaders(headers) {
  if (!headers) return {};

  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ];

  const sanitized = { ...headers };

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return {
    'content-type': sanitized['content-type'],
    'user-agent': sanitized['user-agent'],
    'accept': sanitized['accept'],
    'origin': sanitized['origin'],
    'referer': sanitized['referer'],
  };
}

module.exports = auditLogger;