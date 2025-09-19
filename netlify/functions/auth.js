const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ecoatlas.xyz',
  credentials: true
}));
app.use(express.json());

// Mock user data (in production, use a database)
const users = [
  {
    id: 1,
    email: 'demo@ecoatlas.xyz',
    name: 'Demo User',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.2' // 'demo123'
  }
];

// Google OAuth endpoint
app.post('/google', async (req, res) => {
  try {
    const { id, email, name, picture, email_verified } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if user exists
    let user = users.find(u => u.email === email);
    
    if (!user) {
      // Create new user
      user = {
        id: users.length + 1,
        email: email,
        name: name,
        picture: picture,
        provider: 'google'
      };
      users.push(user);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET || 'ecoatlas-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: 'google'
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Netlify Functions
exports.handler = app;
