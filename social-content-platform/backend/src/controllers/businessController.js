import db from '../config/db.js';

export const getBusinesses = async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        b.id, 
        b.name, 
        b.slug, 
        b.logo_url, 
        b.created_at,
        bu.role,
        CASE WHEN b.owner_id = ? THEN 1 ELSE 0 END as is_owner
      FROM businesses b
      JOIN business_users bu ON b.id = bu.business_id
      WHERE bu.user_id = ? AND bu.joined_at IS NOT NULL
      ORDER BY b.created_at DESC
    `);
    
    stmt.bind([req.user.id, req.user.id]);
    const businesses = [];
    
    while (stmt.step()) {
      const biz = stmt.getAsObject();
      businesses.push({
        id: biz.b_id,
        name: biz.b_name,
        slug: biz.b_slug,
        logoUrl: biz.b_logo_url,
        createdAt: biz.b_created_at,
        role: biz.bu_role,
        isOwner: biz.is_owner === 1
      });
    }
    stmt.free();

    res.json({ businesses });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
};

export const createBusiness = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Generate unique slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let counter = 1;
    let originalSlug = slug;
    
    const checkSlug = () => {
      const stmt = db.prepare('SELECT id FROM businesses WHERE slug = ?');
      stmt.bind([slug]);
      const exists = stmt.step();
      stmt.free();
      return exists;
    };

    while (checkSlug()) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Create business transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // Insert business
      const insertStmt = db.prepare(`
        INSERT INTO businesses (name, slug, owner_id)
        VALUES (?, ?, ?)
      `);
      
      insertStmt.run([name, slug, req.user.id]);
      
      // Get business ID
      const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
      lastIdStmt.step();
      const businessId = lastIdStmt.getAsObject().id;
      lastIdStmt.free();

      // Add creator as owner
      const roleStmt = db.prepare(`
        INSERT INTO business_users (business_id, user_id, role, joined_at)
        VALUES (?, ?, 'owner', CURRENT_TIMESTAMP)
      `);
      
      roleStmt.run([businessId, req.user.id]);

      db.run('COMMIT');

      // Log activity
      logActivity(businessId, req.user.id, 'business_created', 'business', businessId);

      res.status(201).json({
        message: 'Business created successfully',
        business: {
          id: businessId,
          name,
          slug,
          role: 'owner'
        }
      });
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
};

export const getBusiness = async (req, res) => {
  try {
    const businessId = req.params.id;

    // Check access
    const accessStmt = db.prepare(`
      SELECT bu.role, b.*
      FROM businesses b
      JOIN business_users bu ON b.id = bu.business_id
      WHERE b.id = ? AND bu.user_id = ? AND bu.joined_at IS NOT NULL
    `);
    
    accessStmt.bind([businessId, req.user.id]);
    
    if (!accessStmt.step()) {
      accessStmt.free();
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const business = accessStmt.getAsObject();
    accessStmt.free();

    res.json({
      business: {
        id: business.b_id,
        name: business.b_name,
        slug: business.b_slug,
        logoUrl: business.b_logo_url,
        ownerId: business.b_owner_id,
        createdAt: business.b_created_at,
        role: business.bu_role
      }
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const businessId = req.params.id;
    const { name, logoUrl } = req.body;

    // Check if owner or admin
    const roleStmt = db.prepare(`
      SELECT role FROM business_users 
      WHERE business_id = ? AND user_id = ?
    `);
    
    roleStmt.bind([businessId, req.user.id]);
    
    if (!roleStmt.step()) {
      roleStmt.free();
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const role = roleStmt.getAsObject().role;
    roleStmt.free();

    if (!['owner', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Only owners and admins can update business' });
    }

    // Update business
    const updateStmt = db.prepare(`
      UPDATE businesses 
      SET name = COALESCE(?, name), 
          logo_url = COALESCE(?, logo_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    updateStmt.run([name, logoUrl, businessId]);

    res.json({ message: 'Business updated successfully' });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
};

export const deleteBusiness = async (req, res) => {
  try {
    const businessId = req.params.id;

    // Check if owner
    const ownerStmt = db.prepare(`
      SELECT role FROM business_users 
      WHERE business_id = ? AND user_id = ?
    `);
    
    ownerStmt.bind([businessId, req.user.id]);
    
    if (!ownerStmt.step()) {
      ownerStmt.free();
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const role = ownerStmt.getAsObject().role;
    ownerStmt.free();

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete business' });
    }

    // Delete business (cascade will handle related records)
    const deleteStmt = db.prepare('DELETE FROM businesses WHERE id = ?');
    deleteStmt.run([businessId]);

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
};

// Helper function for activity logging
function logActivity(businessId, userId, action, entityType, entityId) {
  try {
    const stmt = db.prepare(`
      INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([businessId, userId, action, entityType, entityId]);
    stmt.free();
  } catch (error) {
    console.error('Activity logging error:', error);
  }
}

export default { 
  getBusinesses, 
  createBusiness, 
  getBusiness, 
  updateBusiness, 
  deleteBusiness 
};
