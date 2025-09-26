const mongoose = require('mongoose');

// Production-ready MongoDB connection with enhanced error handling
class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxAttempts = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connectWithRetry() {
    while (this.connectionAttempts < this.maxAttempts && !this.isConnected) {
      try {
        this.connectionAttempts++;
        console.log(`🔄 MongoDB connection attempt ${this.connectionAttempts}/${this.maxAttempts}...`);
        
        await this.connect();
        this.isConnected = true;
        this.connectionAttempts = 0; // Reset on successful connection
        
        console.log(`✅ MongoDB Connected Successfully`);
        return true;
        
      } catch (error) {
        console.error(`❌ MongoDB connection attempt ${this.connectionAttempts} failed:`, error.message);
        
        if (this.connectionAttempts < this.maxAttempts) {
          console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          this.retryDelay = Math.min(this.retryDelay * 1.5, 30000); // Exponential backoff
        } else {
          console.error('💥 All MongoDB connection attempts failed. Server will continue without database.');
          return false;
        }
      }
    }
    
    return false;
  }

  async connect() {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aps_cybersecurity';
    
    const options = {
      maxPoolSize: 10, // Maximum number of connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds  
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true
    };

    // Note: bufferMaxEntries, bufferCommands, ssl, and sslValidate are deprecated
    // MongoDB Atlas connections handle SSL automatically

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌍 Read Preference: ${conn.connection.readyState === 1 ? 'Primary' : 'Unknown'}`);

    return conn;
  }

  setupEventListeners() {
    // Connection successful
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
      this.isConnected = true;
    });

    // Connection error
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      this.isConnected = false;
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      this.isConnected = false;
    });

    // Reconnection successful
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
      this.isConnected = true;
    });

    // Connection close
    mongoose.connection.on('close', () => {
      console.log('🔌 MongoDB connection closed');
      this.isConnected = false;
    });

    // Handle process termination gracefully
    const gracefulShutdown = async (signal) => {
      console.log(`📡 Received ${signal}. Closing MongoDB connection...`);
      
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  // Health check method
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Get connection status
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      state: states[mongoose.connection.readyState] || 'unknown',
      isHealthy: this.isHealthy(),
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      attempts: this.connectionAttempts
    };
  }
}

// Create database manager instance
const dbManager = new DatabaseManager();

// Enhanced connectDB function with production-ready error handling
const connectDB = async () => {
  try {
    // Setup event listeners first
    dbManager.setupEventListeners();
    
    // Attempt connection with retry logic
    const connected = await dbManager.connectWithRetry();
    
    if (!connected) {
      console.warn('⚠️ Starting server without database connection');
      console.warn('   Database-dependent features will not be available');
    }
    
    return connected;
    
  } catch (error) {
    console.error('💥 Critical database connection error:', error.message);
    console.warn('⚠️ Server will start without database functionality');
    return false;
  }
};

// Export both the connectDB function and dbManager for health checks
module.exports = { connectDB, dbManager };