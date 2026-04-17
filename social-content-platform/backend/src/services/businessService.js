const { generateId } = require('../utils/validation');
const { query, mutate } = require('../config/database');

// Create a new business
function createBusiness(name, ownerId, logo = null) {
  const businessId = generateId();
  
  mutate(
    'INSERT INTO businesses (id, name, logo, owner_id) VALUES (?, ?, ?, ?)',
    [businessId, name, logo, ownerId]
  );
  
  // Add owner as business_user with owner role
  const membershipId = generateId();
  mutate(
    'INSERT INTO business_users (id, business_id, user_id, role) VALUES (?, ?, ?, ?)',
    [membershipId, businessId, ownerId, 'owner']
  );
  
  // Log activity
  logActivity(businessId, ownerId, 'business_created', 'business', businessId);
  
  return getBusinessById(businessId);
}

// Get business by ID
function getBusinessById(businessId) {
  const businesses = query('SELECT * FROM businesses WHERE id = ?', [businessId]);
  return businesses.length > 0 ? businesses[0] : null;
}

// Get all businesses for a user
function getUserBusinesses(userId) {
  return query(`
    SELECT b.*, bu.role, bu.joined_at
    FROM businesses b
    JOIN business_users bu ON b.id = bu.business_id
    WHERE bu.user_id = ?
    ORDER BY bu.joined_at DESC
  `, [userId]);
}

// Update business
function updateBusiness(businessId, updates) {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.logo !== undefined) {
    fields.push('logo = ?');
    values.push(updates.logo);
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(businessId);
  
  mutate(
    `UPDATE businesses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );
  
  return getBusinessById(businessId);
}

// Delete business (owner only)
function deleteBusiness(businessId) {
  // First delete all related records
  mutate('DELETE FROM activity_logs WHERE business_id = ?', [businessId]);
  mutate('DELETE FROM media WHERE content_id IN (SELECT id FROM content WHERE business_id = ?)', [businessId]);
  mutate('DELETE FROM content_platforms WHERE content_id IN (SELECT id FROM content WHERE business_id = ?)', [businessId]);
  mutate('DELETE FROM content WHERE business_id = ?', [businessId]);
  mutate('DELETE FROM business_users WHERE business_id = ?', [businessId]);
  mutate('DELETE FROM businesses WHERE id = ?', [businessId]);
  
  return { success: true };
}

// Invite user to business
function inviteUser(businessId, userId, role) {
  // Check if already member
  const existing = query(
    'SELECT id FROM business_users WHERE business_id = ? AND user_id = ?',
    [businessId, userId]
  );
  
  if (existing.length > 0) {
    throw new Error('User is already a member of this business');
  }
  
  const membershipId = generateId();
  mutate(
    'INSERT INTO business_users (id, business_id, user_id, role) VALUES (?, ?, ?, ?)',
    [membershipId, businessId, userId, role]
  );
  
  logActivity(businessId, userId, 'user_invited', 'user', userId, JSON.stringify({ role }));
  
  return { success: true };
}

// Update user role in business
function updateUserRole(businessId, userId, newRole) {
  mutate(
    'UPDATE business_users SET role = ? WHERE business_id = ? AND user_id = ?',
    [newRole, businessId, userId]
  );
  
  logActivity(businessId, userId, 'role_updated', 'user', userId, JSON.stringify({ role: newRole }));
  
  return { success: true };
}

// Remove user from business
function removeUserFromBusiness(businessId, userId) {
  // Prevent owner from removing themselves
  const membership = query(
    'SELECT role FROM business_users WHERE business_id = ? AND user_id = ?',
    [businessId, userId]
  );
  
  if (membership.length > 0 && membership[0].role === 'owner') {
    throw new Error('Owner cannot be removed. Transfer ownership first.');
  }
  
  mutate('DELETE FROM business_users WHERE business_id = ? AND user_id = ?', [businessId, userId]);
  
  logActivity(businessId, userId, 'user_removed', 'user', userId);
  
  return { success: true };
}

// Get team members for a business
function getTeamMembers(businessId) {
  return query(`
    SELECT u.id, u.email, u.name, bu.role, bu.joined_at
    FROM users u
    JOIN business_users bu ON u.id = bu.user_id
    WHERE bu.business_id = ?
    ORDER BY bu.joined_at DESC
  `, [businessId]);
}

// Log activity
function logActivity(businessId, userId, action, entityType = null, entityId = null, details = null) {
  const logId = generateId();
  mutate(
    'INSERT INTO activity_logs (id, business_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [logId, businessId, userId, action, entityType, entityId, details]
  );
}

// Get activity logs for a business
function getActivityLogs(businessId, limit = 50) {
  return query(`
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM activity_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.business_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `, [businessId, limit]);
}

module.exports = {
  createBusiness,
  getBusinessById,
  getUserBusinesses,
  updateBusiness,
  deleteBusiness,
  inviteUser,
  updateUserRole,
  removeUserFromBusiness,
  getTeamMembers,
  getActivityLogs,
  logActivity
};
