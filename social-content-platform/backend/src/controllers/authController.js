import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import config from '../config/index.js';

export const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    checkStmt.bind([email]);
    
    if (checkStmt.step()) {
      checkStmt.free();
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    checkStmt.free();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const insertStmt = db.prepare(`
      INSERT INTO users (email, password_hash, full_name) 
      VALUES (?, ?, ?)
    `);
    
    insertStmt.run([email, passwordHash, fullName]);
    
    // Get created user
    const userStmt = db.prepare('SELECT id, email, full_name, created_at FROM users WHERE email = ?');
    userStmt.bind([email]);
    userStmt.step();
    const user = userStmt.getAsObject();
    userStmt.free();

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const stmt = db.prepare(`
      SELECT id, email, password_hash, full_name, avatar_url 
      FROM users 
      WHERE email = ?
    `);
    
    stmt.bind([email]);
    
    if (!stmt.step()) {
      stmt.free();
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = stmt.getAsObject();
    stmt.free();

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    const updateStmt = db.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    updateStmt.run([user.id]);
    updateStmt.free();

    // Get user's businesses
    const businessStmt = db.prepare(`
      SELECT b.id, b.name, b.slug, b.logo_url, bu.role
      FROM businesses b
      JOIN business_users bu ON b.id = bu.business_id
      WHERE bu.user_id = ? AND bu.joined_at IS NOT NULL
    `);
    
    businessStmt.bind([user.id]);
    const businesses = [];
    
    while (businessStmt.step()) {
      const biz = businessStmt.getAsObject();
      businesses.push({
        id: biz.b_id,
        name: biz.b_name,
        slug: biz.b_slug,
        logoUrl: biz.b_logo_url,
        role: biz.bu_role
      });
    }
    businessStmt.free();

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        fullName: user.full_name 
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        businesses
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, email, full_name, avatar_url, created_at, last_login_at
      FROM users
      WHERE id = ?
    `);
    
    stmt.bind([req.user.id]);
    
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = stmt.getAsObject();
    stmt.free();

    // Get businesses
    const businessStmt = db.prepare(`
      SELECT b.id, b.name, b.slug, b.logo_url, bu.role
      FROM businesses b
      JOIN business_users bu ON b.id = bu.business_id
      WHERE bu.user_id = ? AND bu.joined_at IS NOT NULL
    `);
    
    businessStmt.bind([req.user.id]);
    const businesses = [];
    
    while (businessStmt.step()) {
      const biz = businessStmt.getAsObject();
      businesses.push({
        id: biz.b_id,
        name: biz.b_name,
        slug: biz.b_slug,
        logoUrl: biz.b_logo_url,
        role: biz.bu_role
      });
    }
    businessStmt.free();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        businesses
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export default { register, login, getProfile };
