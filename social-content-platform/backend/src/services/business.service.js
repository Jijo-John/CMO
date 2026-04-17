const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all businesses for a user
 */
const getUserBusinesses = async (userId) => {
  const result = await pool.query(
    `SELECT b.*, bu.role, bu.joined_at
     FROM businesses b
     JOIN business_users bu ON b.id = bu.business_id
     WHERE bu.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  
  return result.rows;
};

/**
 * Create a new business
 */
const createBusiness = async (ownerId, name, logoUrl = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create business
    const businessResult = await client.query(
      `INSERT INTO businesses (name, logo_url, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, logoUrl, ownerId]
    );
    
    const business = businessResult.rows[0];
    
    // Add owner as business user with owner role
    await client.query(
      `INSERT INTO business_users (business_id, user_id, role, joined_at)
       VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP)`,
      [business.id, ownerId]
    );
    
    await client.query('COMMIT');
    
    return business;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get business by ID
 */
const getBusinessById = async (businessId) => {
  const result = await pool.query(
    'SELECT * FROM businesses WHERE id = $1',
    [businessId]
  );
  
  return result.rows[0] || null;
};

/**
 * Update business
 */
const updateBusiness = async (businessId, updates) => {
  const { name, logoUrl } = updates;
  
  const result = await pool.query(
    `UPDATE businesses
     SET name = COALESCE($1, name),
         logo_url = COALESCE($2, logo_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [name, logoUrl, businessId]
  );
  
  return result.rows[0];
};

/**
 * Delete business
 */
const deleteBusiness = async (businessId) => {
  await pool.query(
    'DELETE FROM businesses WHERE id = $1',
    [businessId]
  );
};

/**
 * Get business members
 */
const getBusinessMembers = async (businessId) => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.avatar_url, bu.role, bu.joined_at
     FROM users u
     JOIN business_users bu ON u.id = bu.user_id
     WHERE bu.business_id = $1
     ORDER BY bu.role, u.full_name`,
    [businessId]
  );
  
  return result.rows;
};

/**
 * Invite user to business
 */
const inviteUser = async (businessId, email, role, invitedBy) => {
  const client = await pool.connect();
  
  try {
    // Check if user exists
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (userResult.rows.length > 0) {
      // User exists, add directly to business
      const userId = userResult.rows[0].id;
      
      // Check if already a member
      const existingMember = await client.query(
        'SELECT id FROM business_users WHERE business_id = $1 AND user_id = $2',
        [businessId, userId]
      );
      
      if (existingMember.rows.length > 0) {
        throw new Error('User is already a member of this business.');
      }
      
      await client.query(
        `INSERT INTO business_users (business_id, user_id, role, joined_at, invited_by)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)`,
        [businessId, userId, role, invitedBy]
      );
      
      return { userId, invited: false };
    } else {
      // User doesn't exist, create invitation
      await client.query(
        `INSERT INTO invitations (business_id, email, role, token, invited_by, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [businessId, email, role, token, invitedBy, expiresAt]
      );
      
      return { token, invited: true };
    }
  } finally {
    client.release();
  }
};

/**
 * Update user role in business
 */
const updateUserRole = async (businessId, userId, role) => {
  const result = await pool.query(
    `UPDATE business_users
     SET role = $1
     WHERE business_id = $2 AND user_id = $3
     RETURNING *`,
    [role, businessId, userId]
  );
  
  return result.rows[0];
};

/**
 * Remove user from business
 */
const removeUserFromBusiness = async (businessId, userId) => {
  await pool.query(
    `DELETE FROM business_users
     WHERE business_id = $1 AND user_id = $2`,
    [businessId, userId]
  );
};

module.exports = {
  getUserBusinesses,
  createBusiness,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinessMembers,
  inviteUser,
  updateUserRole,
  removeUserFromBusiness,
};
