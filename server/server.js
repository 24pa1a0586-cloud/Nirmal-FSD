const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopeasy';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin || origin.startsWith('http://localhost:') || origin === CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Request logger for academic debugging and lab demonstration
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
  res.json({
    success: true,
    message: 'ShopEasy API is running with Fake Store API catalog & JWT Authentication',
    databaseStatus: states[dbState] || 'Unknown',
    timestamp: new Date(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);
app.use('/api', productRoutes); // Proxies Fake Store API for optional local proxying

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected successfully at: ${MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`ShopEasy Backend running on http://localhost:${PORT}`);
      console.log(`Auth Endpoints: /api/auth/register, /api/auth/login, /api/auth/me`);
      console.log(`Orders Endpoints: POST /api/orders, GET /api/orders`);
      console.log(`Product Catalog: Powered by Fake Store API (https://fakestoreapi.com)`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('===============================================');
    console.error('Failed to connect to MongoDB:');
    console.error(error.message);
    console.error('Check your MONGODB_URI in server/.env (e.g. MongoDB Atlas or local mongod).');
    console.error('===============================================');

    app.listen(PORT, () => {
      console.log(`Server started in offline DB mode on port ${PORT}.`);
    });
  }
};

startServer();

module.exports = app;
