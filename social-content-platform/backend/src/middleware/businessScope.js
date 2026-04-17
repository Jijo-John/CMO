const { query } = require('../config/database');

// Business scope middleware - ensures all queries are scoped to the user's business
function scopeToBusiness(req, res, next) {
  const businessId = req.params.businessId || req.body.businessId || req.query.businessId;
  
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' });
  }
  
  // Verify user has access to this business
  const membership = query(
    'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
    [req.user.id, businessId]
  );
  
  if (membership.length === 0) {
    return res.status(403).json({ error: 'Access denied to this business' });
  }
  
  req.businessId = businessId;
  req.userRole = membership[0].role;
  
  next();
}

// Optional business scoping - doesn't fail if business not provided
function optionalBusinessScope(req, res, next) {
  const businessId = req.params.businessId || req.body.businessId || req.query.businessId;
  
  if (businessId) {
    const membership = query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, businessId]
    );
    
    if (membership.length > 0) {
      req.businessId = businessId;
      req.userRole = membership[0].role;
    }
  }
  
  next();
}

module.exports = {
  scopeToBusiness,
  optionalBusinessScope
};
