const { pool } = require('../config/database');

/**
 * Business Isolation Middleware
 * Ensures all queries are scoped to the user's business
 */
const scopeToBusiness = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const businessId = req.params.businessId || req.body.businessId || req.query.businessId;
    
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required.',
      });
    }
    
    // Verify user has access to this business
    const result = await pool.query(
      `SELECT id FROM business_users 
       WHERE business_id = $1 AND user_id = $2`,
      [businessId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this business.',
      });
    }
    
    // Attach business ID to request for use in controllers
    req.businessId = businessId;
    
    next();
  } catch (error) {
    console.error('Business scope error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying business access.',
    });
  }
};

module.exports = { scopeToBusiness };
