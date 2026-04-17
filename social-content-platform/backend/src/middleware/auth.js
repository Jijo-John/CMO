const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Authentication middleware - verifies JWT token
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists
    const users = query('SELECT id, email, name FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get user's role in a specific business
function getUserRole(userId, businessId) {
  const result = query(
    'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
    [userId, businessId]
  );
  
  return result.length > 0 ? result[0].role : null;
}

module.exports = {
  authenticate,
  getUserRole
};
