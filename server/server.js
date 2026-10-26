const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopeasy';

// Allowed origins for CORS (normalized without trailing slashes)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/+$/, ''));

// CORS Configuration with Credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server health checks, curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.trim().replace(/\/+$/, '');

      if (
        allowedOrigins.includes(cleanOrigin) ||
        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))
      ) {
        return callback(null, true);
      }

      // In production, block unauthorized origins
      const corsError = new Error(`CORS blocked request from origin: ${origin}`);
      corsError.status = 403;
      return callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json());

// Safe request logger (never logs request body or sensitive tokens)
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint (reports status to Render and monitoring tools)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
  const isConnected = dbState === 1;

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'healthy' : 'degraded',
    server: 'online',
    database: states[dbState] || 'Unknown',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    catalogSource: 'Fake Store API (https://fakestoreapi.com)',
  });
});

// Middleware to ensure MongoDB is connected for database-dependent routes
const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database service is temporarily unavailable. Please verify MONGODB_URI configuration.',
      error: 'DB_DISCONNECTED',
    });
  }
  next();
};

// Mount API Routes
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api', requireDatabase, orderRoutes);
app.use('/api', productRoutes); // Proxies Fake Store API (independent of MongoDB)

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS blocked')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  console.error('Unhandled server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred',
  });
});

// Safely mask credentials in connection string for logging
const getMaskedMongoUri = (uri) => {
  try {
    return uri.replace(/:([^:@]+)@/, ':****@');
  } catch {
    return '[PROTECTED]';
  }
};

// Connect to MongoDB and start HTTP listener
const startServer = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected successfully at: ${getMaskedMongoUri(MONGODB_URI)}`);

    app.listen(PORT, HOST, () => {
      console.log(`===============================================`);
      console.log(`ShopEasy Backend running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health Check: http://${HOST}:${PORT}/api/health`);
      console.log(`CORS Allowed Origin: ${process.env.CLIENT_URL || 'development default'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('===============================================');
    console.error('Failed to connect to MongoDB:');
    console.error(error.message);
    console.error('Verify your MONGODB_URI in Render environment variables.');
    console.error('===============================================');

    // Start server in degraded mode so /api/health can report status without crashing container
    app.listen(PORT, HOST, () => {
      console.log(`Server started in degraded mode on port ${PORT} (Database offline).`);
    });
  }
};

startServer();

module.exports = app;
