import db from '../config/db.js';

// Role hierarchy (higher number = more permissions)
const roleHierarchy = {
  viewer: 1,
  reviewer: 2,
  creator: 3,
  admin: 4,
  owner: 5
};

export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const businessId = req.headers['x-business-id'];
      
      if (!businessId) {
        return res.status(400).json({ 
          error: 'Business ID required. Please select a business.' 
        });
      }

      // Get user's role in this business
      const stmt = db.prepare(`
        SELECT role FROM business_users 
        WHERE business_id = ? AND user_id = ? AND joined_at IS NOT NULL
      `);
      
      stmt.bind([businessId, req.user.id]);
      
      if (!stmt.step()) {
        stmt.free();
        return res.status(403).json({ 
          error: 'Access denied. You are not a member of this business.' 
        });
      }
      
      const result = stmt.getAsObject();
      stmt.free();
      
      const userRole = result.role;
      
      // Check if user's role is sufficient
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
        });
      }

      // Attach business context to request
      req.businessContext = {
        businessId,
        role: userRole
      };

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ 
        error: 'Authorization check failed' 
      });
    }
  };
};

export const canEditContent = async (req, res, next) => {
  try {
    const contentId = req.params.id || req.body.contentId;
    const businessId = req.businessContext?.businessId;
    
    if (!contentId || !businessId) {
      return res.status(400).json({ error: 'Missing content or business ID' });
    }

    const userRole = req.businessContext?.role;
    
    // Owner and Admin can always edit
    if (['owner', 'admin'].includes(userRole)) {
      return next();
    }

    // Creator can edit only draft content they created
    const stmt = db.prepare(`
      SELECT created_by, status FROM content 
      WHERE id = ? AND business_id = ?
    `);
    
    stmt.bind([contentId, businessId]);
    
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const content = stmt.getAsObject();
    stmt.free();
    
    if (userRole === 'creator' && content.status === 'draft' && content.created_by === req.user.id) {
      return next();
    }

    return res.status(403).json({ 
      error: 'You do not have permission to edit this content' 
    });
  } catch (error) {
    console.error('Content edit check error:', error);
    return res.status(500).json({ error: 'Permission check failed' });
  }
};

export const canApproveContent = async (req, res, next) => {
  try {
    const userRole = req.businessContext?.role;
    
    // Only Owner, Admin, and Reviewer can approve
    if (['owner', 'admin', 'reviewer'].includes(userRole)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Only reviewers, admins, and owners can approve content' 
    });
  } catch (error) {
    console.error('Approval check error:', error);
    return res.status(500).json({ error: 'Permission check failed' });
  }
};

export default requireRole;
