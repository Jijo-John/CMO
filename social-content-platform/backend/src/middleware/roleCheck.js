const { getUserRole, ROLE_HIERARCHY } = require('../utils/validation');
const { query } = require('../config/database');

// Role-based access control middleware factory
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const businessId = req.params.businessId || req.body.businessId || req.query.businessId;
    
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }
    
    const userRole = getUserRole(req.user.id, businessId);
    
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied to this business' });
    }
    
    // Check if user's role is in allowed roles
    const hasAccess = allowedRoles.some(role => 
      ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
    );
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }
    
    req.userRole = userRole;
    next();
  };
}

// Specific role checkers
const requireOwner = requireRole('owner');
const requireAdmin = requireRole('admin', 'owner');
const requireReviewer = requireRole('reviewer', 'admin', 'owner');
const requireCreator = requireRole('creator', 'reviewer', 'admin', 'owner');
const requireViewer = requireRole('viewer', 'creator', 'reviewer', 'admin', 'owner');

module.exports = {
  requireRole,
  requireOwner,
  requireAdmin,
  requireReviewer,
  requireCreator,
  requireViewer
};
