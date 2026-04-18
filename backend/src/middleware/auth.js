const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = getDb();
    const userResult = db.exec(`SELECT id, email, name, avatar FROM users WHERE id = '${decoded.userId}'`);
    
    if (userResult.length === 0 || userResult[0].values.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: userResult[0].values[0][0],
      email: userResult[0].values[0][1],
      name: userResult[0].values[0][2],
      avatar: userResult[0].values[0][3]
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const getBusinessRole = (businessId, userId) => {
  const db = getDb();
  const result = db.exec(`
    SELECT role FROM business_users 
    WHERE business_id = '${businessId}' AND user_id = '${userId}'
  `);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  return result[0].values[0][0];
};

const requireBusinessAccess = (minRole = 'viewer') => {
  const roleHierarchy = {
    'viewer': 1,
    'creator': 2,
    'reviewer': 3,
    'admin': 4,
    'owner': 5
  };

  return async (req, res, next) => {
    const businessId = req.params.businessId || req.body.businessId || req.query.businessId;
    
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }

    const role = getBusinessRole(businessId, req.user.id);
    
    if (!role) {
      return res.status(403).json({ error: 'Access denied to this business' });
    }

    if (roleHierarchy[role] < roleHierarchy[minRole]) {
      return res.status(403).json({ error: `Insufficient permissions. Required: ${minRole}` });
    }

    req.businessRole = role;
    req.businessId = businessId;
    next();
  };
};

const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    if (!req.businessRole) {
      return res.status(403).json({ error: 'Business context required' });
    }

    if (!roleArray.includes(req.businessRole)) {
      return res.status(403).json({ error: `Required roles: ${roleArray.join(', ')}` });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  getBusinessRole,
  requireBusinessAccess,
  requireRole
};
