const express = require('express');
const path = require('path');
require('dotenv').config();

const logger = require('./middleware/logger');

const app = express();

// Security middleware
app.disable('x-powered-by');

// Application middleware
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/', express.static(path.join(__dirname, 'public')));

// Environment variables
const PORT = process.env.APP_PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key-for-testing';

if (!process.env.SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.error('ERROR: SECRET_KEY must be defined in environment variables for production');
  process.exit(1);
}

/**
 * Utility function to greet a user
 * @param {string} name - The name of the user
 * @returns {string} Greeting message
 */
function greet(name) {
  if (!name || typeof name !== 'string') {
    return 'Hello, Guest';
  }
  return `Hello, ${name.trim()}`;
}

/**
 * Fetch user data from external API
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object>} User data
 */
async function fetchUser(userId = '1') {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error.message);
    throw error;
  }
}

/**
 * Validate and sanitize user ID parameter
 * @param {string} id - The user ID to validate
 * @returns {boolean} Whether the ID is valid
 */
function isValidUserId(id) {
  return /^[0-9]+$/.test(id);
}

// Routes
app.get('/user/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidUserId(id)) {
    return res.status(400).json({
      error: 'Invalid user ID. Must be a positive integer.'
    });
  }

  try {
    const user = await fetchUser(id);
    res.json({
      userId: id,
      user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user data'
    });
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for testing
module.exports = app;
