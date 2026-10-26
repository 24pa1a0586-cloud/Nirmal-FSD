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

// Trust reverse proxy for Render deployment (enables req.secure and proper cookie handling)
app.set('trust proxy', 1);

// Allowed origins for CORS (normalized without trailing slashes)
const buildAllowedOrigins = () => {
  const origins = new Set([
    'https://shopeasy-fsd.onrender.com', // Render production frontend
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
  ]);

  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((url) => {
      const clean = url.trim().replace(/\/+$/, '');
      if (clean) origins.add(clean);
    });
  }

  return origins;
};

const allowedOrigins = buildAllowedOrigins();

// CORS Configuration with Credentials
const corsOptions = {
  origin: (origin, callback) => {
    // Requests with no origin (e.g., curl, uptime monitors, server-to-server health checks)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    if (
      allowedOrigins.has(cleanOrigin) ||
      cleanOrigin === 'https://shopeasy-fsd.onrender.com' ||
      (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))
    ) {
      // Must reflect the exact requesting origin when credentials are true
      return callback(null, true);
    }

    console.warn(`[CORS] Disallowed origin requested: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
};

// 1. Run CORS middleware before any routes
app.use(cors(corsOptions));

// 2. Explicitly handle preflight OPTIONS for all routes
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// Safe request logger (never logs request bodies or credentials)
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Health check endpoint (reports status to Render without database lock)
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

// Database check middleware (allows preflight OPTIONS requests without DB dependency)
const requireDatabase = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database service is temporarily unavailable. Please verify MONGODB_URI configuration in Render.',
      error: 'DB_DISCONNECTED',
    });
  }
  next();
};

// Mount API Routes
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/orders', requireDatabase, orderRoutes);
app.use('/api', productRoutes); // Proxies Fake Store API (independent of MongoDB)

// 404 handler for any unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on server`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
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
      console.log(`Allowed Origins: ${Array.from(allowedOrigins).join(', ')}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('===============================================');
    console.error('Failed to connect to MongoDB:');
    console.error(error.message);
    console.error('Verify your MONGODB_URI in Render environment variables.');
    console.error('===============================================');

    // Start server in degraded mode so /api/health and CORS can respond
    app.listen(PORT, HOST, () => {
      console.log(`Server started in degraded mode on port ${PORT} (Database offline).`);
    });
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
