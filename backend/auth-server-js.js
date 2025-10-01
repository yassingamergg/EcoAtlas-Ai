const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const validator = require('validator');
const fs = require('fs');
const path = require('path');

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
  max: 20, // limit each IP to 20 requests per windowMs
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
let db;
const dbPath = './auth.db';

// Initialize database
async function initDatabase() {
  try {
    const SQL = await initSqlJs();
    
    // Check if database file exists
    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
    } else {
      db = new SQL.Database();
    }

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        real_name TEXT,
        is_verified INTEGER DEFAULT 0,
        verification_code TEXT,
        verification_expires TEXT,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        last_login TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        user_id INTEGER,
        success INTEGER DEFAULT 0,
        attempted_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// Save database to file
function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to generate verification code
const generateVerificationCode = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to check if user is locked
const isUserLocked = (user) => {
  if (!user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
};

// Helper function to lock user account
const lockUserAccount = (userId, minutes = 30) => {
  const lockUntil = new Date(Date.now() + minutes * 60 * 1000);
  const stmt = db.prepare('UPDATE users SET locked_until = ? WHERE id = ?');
  stmt.run([lockUntil.toISOString(), userId]);
  saveDatabase();
};

// Helper function to increment failed login attempts
const incrementFailedAttempts = (userId) => {
  const stmt = db.prepare('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?');
  stmt.run([userId]);
  saveDatabase();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'EcoAtlas Auth Backend'
  });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, realName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const stmt = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?');
    const existingUser = stmt.get([email, username]);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert user
    const insertStmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, real_name, verification_code, verification_expires)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertStmt.run([username, email, passwordHash, realName, verificationCode, verificationExpires.toISOString()]);
    saveDatabase();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify?code=${verificationCode}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your EcoAtlas AI account',
      html: `
        <h2>Welcome to EcoAtlas AI!</h2>
        <p>Please click the link below to verify your account:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Account</a>
        <p>Or copy and paste this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      message: 'User registered successfully. Please check your email for verification.',
      userId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email endpoint
app.post('/api/auth/verify', (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    // Find user and verify code
    const stmt = db.prepare(`
      SELECT id, username, verification_code, verification_expires 
      FROM users 
      WHERE verification_code = ? AND verification_expires > datetime('now')
    `);
    const user = stmt.get([code]);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Update user as verified
    const updateStmt = db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?');
    updateStmt.run([user.id]);
    saveDatabase();

    res.json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const stmt = db.prepare(`
      SELECT id, username, email, real_name, password_hash, is_verified, 
             failed_login_attempts, locked_until
      FROM users 
      WHERE email = ?
    `);
    const user = stmt.get([email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is locked
    if (isUserLocked(user)) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to too many failed login attempts',
        lockedUntil: user.locked_until
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed login attempts
      incrementFailedAttempts(user.id);
      
      // Lock account after 5 failed attempts
      const updatedStmt = db.prepare('SELECT failed_login_attempts FROM users WHERE id = ?');
      const updatedUser = updatedStmt.get([user.id]);
      if (updatedUser.failed_login_attempts >= 5) {
        lockUserAccount(user.id);
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    // Reset failed login attempts on successful login
    const resetStmt = db.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login = datetime('now')
      WHERE id = ?
    `);
    resetStmt.run([user.id]);
    saveDatabase();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

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

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile endpoint
app.get('/api/auth/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const stmt = db.prepare(`
      SELECT id, username, email, real_name, created_at, last_login
      FROM users 
      WHERE id = ?
    `);
    const user = stmt.get([decoded.userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const stmt = db.prepare('SELECT id, username, email, real_name FROM users WHERE email = ?');
    const user = stmt.get([email]);
    
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset code
    const insertStmt = db.prepare(`
      INSERT INTO verification_codes (user_id, code, expires_at)
      VALUES (?, ?, ?)
    `);
    insertStmt.run([user.id, resetCode, resetExpires.toISOString()]);
    saveDatabase();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?code=${resetCode}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your EcoAtlas AI password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.real_name || user.username},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'If the email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
      return res.status(400).json({ error: 'Reset code and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find valid reset code
    const stmt = db.prepare(`
      SELECT user_id FROM verification_codes 
      WHERE code = ? AND expires_at > datetime('now')
    `);
    const resetRecord = stmt.get([code]);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    updateStmt.run([passwordHash, resetRecord.user_id]);
    saveDatabase();

    // Delete used reset code
    const deleteStmt = db.prepare('DELETE FROM verification_codes WHERE code = ?');
    deleteStmt.run([code]);
    saveDatabase();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`EcoAtlas Auth Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});

startServer().catch(console.error);
