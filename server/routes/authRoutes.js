const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shopeasy_development_super_secret_jwt_key_2026';

// Helper to generate JWT token and cookie options
const createToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const getCookieOptions = (req) => {
  const isHttps =
    process.env.NODE_ENV === 'production' ||
    Boolean(req && (req.secure || req.headers?.['x-forwarded-proto'] === 'https'));

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password, confirmPassword } = req.body;

    // Field presence checks
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // Password confirmation check if passed
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Format & regex checks
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const usernameTrimmed = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (usernameTrimmed.length < 3 || !usernameRegex.test(usernameTrimmed)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters and contain only letters, numbers, and underscores',
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Check duplicate username
    const existingUsername = await User.findOne({ username: usernameTrimmed });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please choose another.',
      });
    }

    // Create new user (pre-save hook hashes password)
    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: usernameTrimmed,
      password,
    });

    const savedUser = await newUser.save();
    const token = createToken(savedUser);

    // Set HttpOnly cookie
    res.cookie('token', token, getCookieOptions(req));

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: savedUser.toJSON(),
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user account. Please try again.',
      error: error.message,
    });
  }
});

// POST /api/auth/login - Log in with email or username
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, email, username, password } = req.body;
    const identifier = (emailOrUsername || email || username || '').trim().toLowerCase();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address or username',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    // Find user by email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    // Compare hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    const token = createToken(user);

    // Set HttpOnly cookie
    res.cookie('token', token, getCookieOptions(req));

    res.json({
      success: true,
      message: 'Logged in successfully!',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed due to a server error. Please try again.',
      error: error.message,
    });
  }
});

// POST /api/auth/logout - Clear session cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', getCookieOptions(req));

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/me - Retrieve authenticated user profile
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
