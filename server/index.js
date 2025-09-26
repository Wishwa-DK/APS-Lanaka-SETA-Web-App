require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const path = require('path');

// Import database connection with production error handling
const { connectDB, dbManager } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const policyRoutes = require('./routes/policies');
const trainingRoutes = require('./routes/training');
const riskRoutes = require('./routes/risk');
const complianceRoutes = require('./routes/compliance');
const auditRoutes = require('./routes/audit');
const profileRoutes = require('./routes/simple-profile');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (optional for development)
connectDB().catch(err => {
  console.log('⚠️  MongoDB connection failed, continuing without database');
  console.log('   Note: Database-dependent routes may not work');
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
});

// Prevent parameter pollution
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
    });
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Static file serving with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Enhanced health check endpoint with database status
app.get('/health', (req, res) => {
  const dbStatus = dbManager.getStatus();
  
  const health = {
    status: dbStatus.isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      connected: dbStatus.isHealthy,
      state: dbStatus.state,
      host: dbStatus.host,
      name: dbStatus.name,
      attempts: dbStatus.attempts
    },
    services: {
      authentication: dbStatus.isHealthy ? 'operational' : 'degraded',
      policies: dbStatus.isHealthy ? 'operational' : 'degraded',
      training: dbStatus.isHealthy ? 'operational' : 'degraded',
      compliance: dbStatus.isHealthy ? 'operational' : 'degraded'
    }
  };
  
  // Return appropriate HTTP status
  const httpStatus = dbStatus.isHealthy ? 200 : 503;
  res.status(httpStatus).json(health);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/profile', profileRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'APS Lanka Cybersecurity Platform API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      policies: '/api/policies',
      training: '/api/training',
      risk: '/api/risk',
      compliance: '/api/compliance',
      audit: '/api/audit'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Log security-related errors
  if (err.type === 'entity.parse.failed') {
    console.warn('Malformed JSON payload detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
  }
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`🚀 APS Lanka Cybersecurity Platform API running on port ${PORT}`);
  console.log(`🔒 Security features enabled: Helmet, CORS, Rate Limiting, XSS Protection`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});