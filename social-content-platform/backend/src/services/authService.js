const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { isValidEmail, generateId } = require('../utils/validation');
const { query, mutate } = require('../config/database');

// Register new user
async function registerUser(email, password, name) {
  // Validate email
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(', '));
  }
  
  // Check if user already exists
  const existing = query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const userId = generateId();
  mutate(
    'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
    [userId, email, hashedPassword, name]
  );
  
  // Generate token
  const token = generateToken({ userId, email });
  
  return {
    user: { id: userId, email, name },
    token
  };
}

// Login user
async function loginUser(email, password) {
  // Find user
  const users = query('SELECT * FROM users WHERE email = ?', [email]);
  
  if (users.length === 0) {
    throw new Error('Invalid credentials');
  }
  
  const user = users[0];
  
  // Verify password
  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate token
  const token = generateToken({ userId: user.id, email: user.email });
  
  return {
    user: { id: user.id, email: user.email, name: user.name },
    token
  };
}

// Get user by ID
function getUserById(userId) {
  const users = query('SELECT id, email, name, created_at FROM users WHERE id = ?', [userId]);
  return users.length > 0 ? users[0] : null;
}

// Get user's businesses
function getUserBusinesses(userId) {
  return query(`
    SELECT b.*, bu.role, bu.joined_at
    FROM businesses b
    JOIN business_users bu ON b.id = bu.business_id
    WHERE bu.user_id = ?
    ORDER BY bu.joined_at DESC
  `, [userId]);
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  getUserBusinesses
};
