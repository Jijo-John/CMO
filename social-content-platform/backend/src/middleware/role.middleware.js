const { pool } = require('../config/database');

/**
 * Role-Based Access Control Middleware
 * Checks if user has required role for the business
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const businessId = req.params.businessId || req.body.businessId || req.query.businessId;
      
      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'Business ID is required.',
        });
      }
      
      // Get user's role in the business
      const result = await pool.query(
        `SELECT role FROM business_users 
         WHERE business_id = $1 AND user_id = $2`,
        [businessId, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this business.',
        });
      }
      
      const userRole = result.rows[0].role;
      
      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`,
        });
      }
      
      // Attach role to request for later use
      req.userRole = userRole;
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions.',
      });
    }
  };
};

/**
 * Business Ownership Middleware
 * Checks if user owns the business
 */
const isOwner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const businessId = req.params.businessId || req.params.id;
    
    const result = await pool.query(
      `SELECT id FROM businesses WHERE id = $1 AND owner_id = $2`,
      [businessId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the owner can perform this action.',
      });
    }
    
    next();
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking ownership.',
    });
  }
};

module.exports = { checkRole, isOwner };
