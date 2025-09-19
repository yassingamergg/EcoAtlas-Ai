const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const validator = require('validator');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs (increased for testing)
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use(generalLimiter);

// Database setup
const db = new sqlite3.Database('./auth.db');

// Create users table with security features
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    real_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT 0,
    verification_code TEXT,
    verification_expires DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    reset_token TEXT,
    reset_expires DATETIME
  )`);

  // Create verification codes table for tracking
  db.run(`CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create login attempts table for security monitoring
  db.run(`CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    username TEXT,
    success BOOLEAN DEFAULT 0,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT
  )`);
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change to your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Utility functions
function generateVerificationCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isAccountLocked(lockedUntil) {
  return lockedUntil && new Date() < new Date(lockedUntil);
}

function logLoginAttempt(ip, username, success, userAgent) {
  const stmt = db.prepare(`
    INSERT INTO login_attempts (ip_address, username, success, user_agent)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(ip, username, success, userAgent);
  stmt.finalize();
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Sign up endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, realName, password } = req.body;

    // Input validation
    if (!username || !email || !realName || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Validate username (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (row) {
        return res.status(409).json({ error: 'User with this email or username already exists' });
      }

      // Hash password
      bcrypt.hash(password, 12, (err, hashedPassword) => {
        if (err) {
          console.error('Password hashing error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert user into database
        const stmt = db.prepare(`
          INSERT INTO users (username, email, real_name, password_hash, verification_code, verification_expires)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run([username, email, realName, hashedPassword, verificationCode, verificationExpires], function(err) {
          if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          const userId = this.lastID;

          // Send verification email
          const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: email,
            subject: 'EcoAtlas AI - Verify Your Account',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2d5a27;">Welcome to EcoAtlas AI!</h2>
                <p>Hello ${realName},</p>
                <p>Thank you for signing up! Please verify your account using the code below:</p>
                <div style="background-color: #f0f8f0; padding: 20px; text-align: center; margin: 20px 0;">
                  <h1 style="color: #2d5a27; font-size: 32px; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
                </div>
                <p>This code will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 14px;">EcoAtlas AI - Environmental Monitoring Platform</p>
              </div>
            `
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Email sending error:', error);
              return res.status(500).json({ error: 'Failed to send verification email' });
            }

            console.log('Verification email sent:', info.messageId);
            res.status(201).json({ 
              message: 'Account created successfully. Please check your email for verification code.',
              userId: userId
            });
          });
        });

        stmt.finalize();
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify account endpoint
app.post('/api/auth/verify', (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Find user and verify code
    db.get(`
      SELECT id, username, verification_code, verification_expires 
      FROM users 
      WHERE email = ? AND is_verified = 0
    `, [email], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found or already verified' });
      }

      if (user.verification_code !== verificationCode) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      if (new Date() > new Date(user.verification_expires)) {
        return res.status(400).json({ error: 'Verification code has expired' });
      }

      // Update user as verified
      db.run('UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?', 
        [user.id], (err) => {
          if (err) {
            console.error('Database update error:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          res.json({ message: 'Account verified successfully!' });
        });
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    db.get(`
      SELECT id, username, email, real_name, password_hash, is_verified, 
             failed_login_attempts, locked_until
      FROM users 
      WHERE username = ?
    `, [username], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        logLoginAttempt(clientIP, username, false, userAgent);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        logLoginAttempt(clientIP, username, false, userAgent);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Check if account is locked
      if (isAccountLocked(user.locked_until)) {
        logLoginAttempt(clientIP, username, false, userAgent);
        return res.status(423).json({ error: 'Account is temporarily locked due to too many failed attempts' });
      }

      // Check if account is verified
      if (!user.is_verified) {
        logLoginAttempt(clientIP, username, false, userAgent);
        return res.status(403).json({ error: 'Please verify your account before logging in' });
      }

      // Verify password
      bcrypt.compare(password, user.password_hash, (err, isMatch) => {
        if (err) {
          console.error('Password comparison error:', err);
          logLoginAttempt(clientIP, username, false, userAgent);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!isMatch) {
          // Increment failed login attempts
          const newFailedAttempts = user.failed_login_attempts + 1;
          let lockedUntil = null;

          // Lock account after 5 failed attempts for 30 minutes
          if (newFailedAttempts >= 5) {
            lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
          }

          db.run(`
            UPDATE users 
            SET failed_login_attempts = ?, locked_until = ?
            WHERE id = ?
          `, [newFailedAttempts, lockedUntil, user.id]);

          logLoginAttempt(clientIP, username, false, userAgent);
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Reset failed login attempts on successful login
        db.run(`
          UPDATE users 
          SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [user.id]);

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            username: user.username, 
            email: user.email 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        logLoginAttempt(clientIP, username, true, userAgent);

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            realName: user.real_name
          }
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile endpoint
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    db.get(`
      SELECT id, username, email, real_name, created_at, last_login
      FROM users 
      WHERE id = ?
    `, [req.user.userId], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth callback endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { id, email, name, picture, email_verified } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if user exists
    db.get('SELECT id, username, email, real_name FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (existingUser) {
        // User exists, generate token and login
        const token = jwt.sign(
          { 
            userId: existingUser.id, 
            username: existingUser.username, 
            email: existingUser.email 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: 'Google login successful',
          token,
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            realName: existingUser.real_name,
            picture: picture,
            provider: 'google'
          }
        });
      } else {
        // Create new user from Google data
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        const realName = name;
        
        // Generate unique username if needed
        let finalUsername = username;
        let counter = 1;
        
        const checkUsername = () => {
          db.get('SELECT id FROM users WHERE username = ?', [finalUsername], (err, user) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (user) {
              finalUsername = `${username}${counter}`;
              counter++;
              checkUsername();
            } else {
              // Username is available, create user
              const stmt = db.prepare(`
                INSERT INTO users (username, email, real_name, password_hash, is_verified)
                VALUES (?, ?, ?, ?, ?)
              `);
              
              stmt.run([finalUsername, email, realName, 'google_oauth', 1], function(err) {
                if (err) {
                  console.error('Database insert error:', err);
                  return res.status(500).json({ error: 'Internal server error' });
                }

                const userId = this.lastID;
                
                // Generate JWT token
                const token = jwt.sign(
                  { 
                    userId: userId, 
                    username: finalUsername, 
                    email: email 
                  },
                  JWT_SECRET,
                  { expiresIn: '24h' }
                );

                res.json({
                  message: 'Google account created and logged in successfully',
                  token,
                  user: {
                    id: userId,
                    username: finalUsername,
                    email: email,
                    realName: realName,
                    picture: picture,
                    provider: 'google'
                  }
                });
              });
              
              stmt.finalize();
            }
          });
        };
        
        checkUsername();
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side token removal)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Authentication server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down authentication server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});


