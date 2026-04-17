const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Register a new user
 */
const register = async (email, password, fullName) => {
  const client = await pool.connect();
  
  try {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists.');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [email, passwordHash, fullName]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Login user
 */
const login = async (email, password) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Invalid email or password.');
  }
  
  const user = result.rows[0];
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
    },
    token,
  };
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  const result = await pool.query(
    'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
    [userId]
  );
  
  return result.rows[0] || null;
};

/**
 * Update user profile
 */
const updateUser = async (userId, updates) => {
  const { fullName, avatarUrl } = updates;
  
  const result = await pool.query(
    `UPDATE users 
     SET full_name = COALESCE($1, full_name),
         avatar_url = COALESCE($2, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, email, full_name, avatar_url`,
    [fullName, avatarUrl, userId]
  );
  
  return result.rows[0];
};

module.exports = {
  register,
  login,
  getUserById,
  updateUser,
};
