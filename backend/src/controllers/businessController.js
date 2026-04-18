const { v4: uuidv4 } = require('uuid');
const { getDb, saveDatabase } = require('../config/database');

// Get all businesses for current user
const getBusinesses = async (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(`
      SELECT b.*, bu.role
      FROM businesses b
      JOIN business_users bu ON b.id = bu.business_id
      WHERE bu.user_id = '${req.user.id}'
      ORDER BY b.created_at DESC
    `);

    const businesses = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      logo: row[2],
      owner_id: row[3],
      created_at: row[4],
      updated_at: row[5],
      role: row[6]
    })) : [];

    res.json({ businesses });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
};

// Get single business
const getBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const db = getDb();

    const result = db.exec(`
      SELECT b.*, bu.role
      FROM businesses b
      JOIN business_users bu ON b.id = bu.business_id
      WHERE b.id = '${businessId}' AND bu.user_id = '${req.user.id}'
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const row = result[0].values[0];
    const business = {
      id: row[0],
      name: row[1],
      logo: row[2],
      owner_id: row[3],
      created_at: row[4],
      updated_at: row[5],
      role: row[6]
    };

    res.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
};

// Create new business
const createBusiness = async (req, res) => {
  try {
    const { name, logo } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const db = getDb();
    const businessId = uuidv4();

    // Create business
    db.run(`
      INSERT INTO businesses (id, name, logo, owner_id)
      VALUES ('${businessId}', '${name}', '${logo || ''}', '${req.user.id}')
    `);

    // Add user as owner
    const buId = uuidv4();
    db.run(`
      INSERT INTO business_users (id, business_id, user_id, role, joined_at)
      VALUES ('${buId}', '${businessId}', '${req.user.id}', 'owner', CURRENT_TIMESTAMP)
    `);

    // Log activity
    const logId = uuidv4();
    db.run(`
      INSERT INTO activity_logs (id, business_id, user_id, action, entity_type, entity_id, details)
      VALUES ('${logId}', '${businessId}', '${req.user.id}', 'created', 'business', '${businessId}', 'Business created')
    `);

    saveDatabase();

    res.status(201).json({
      message: 'Business created successfully',
      business: {
        id: businessId,
        name,
        logo: logo || null,
        owner_id: req.user.id
      }
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
};

// Update business
const updateBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { name, logo } = req.body;

    const db = getDb();

    // Verify ownership or admin role
    const accessCheck = db.exec(`
      SELECT role FROM business_users 
      WHERE business_id = '${businessId}' AND user_id = '${req.user.id}'
    `);

    if (accessCheck.length === 0 || accessCheck[0].values.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const role = accessCheck[0].values[0][0];
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ error: 'Only owner or admin can update business' });
    }

    const updates = [];
    if (name) updates.push(`name = '${name}'`);
    if (logo !== undefined) updates.push(`logo = '${logo}'`);

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      db.run(`UPDATE businesses SET ${updates.join(', ')} WHERE id = '${businessId}'`);
    }

    saveDatabase();

    res.json({ message: 'Business updated successfully' });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
};

// Delete business
const deleteBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const db = getDb();

    // Verify ownership
    const ownerCheck = db.exec(`
      SELECT role FROM business_users 
      WHERE business_id = '${businessId}' AND user_id = '${req.user.id}' AND role = 'owner'
    `);

    if (ownerCheck.length === 0 || ownerCheck[0].values.length === 0) {
      return res.status(403).json({ error: 'Only the owner can delete this business' });
    }

    db.run(`DELETE FROM businesses WHERE id = '${businessId}'`);
    saveDatabase();

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
};

// Get business users
const getBusinessUsers = async (req, res) => {
  try {
    const { businessId } = req.params;
    const db = getDb();

    const result = db.exec(`
      SELECT u.id, u.email, u.name, u.avatar, bu.role, bu.joined_at
      FROM users u
      JOIN business_users bu ON u.id = bu.user_id
      WHERE bu.business_id = '${businessId}'
      ORDER BY bu.joined_at DESC
    `);

    const users = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      email: row[1],
      name: row[2],
      avatar: row[3],
      role: row[4],
      joined_at: row[5]
    })) : [];

    res.json({ users });
  } catch (error) {
    console.error('Get business users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Invite user to business
const inviteUser = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    const validRoles = ['viewer', 'creator', 'reviewer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const db = getDb();

    // Check if user exists
    const userResult = db.exec(`SELECT id FROM users WHERE email = '${email}'`);
    
    const inviteToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const inviteId = uuidv4();
    db.run(`
      INSERT INTO invite_tokens (id, business_id, email, role, token, expires_at)
      VALUES ('${inviteId}', '${businessId}', '${email}', '${role}', '${inviteToken}', '${expiresAt}')
    `);

    saveDatabase();

    res.json({
      message: 'Invitation created successfully',
      inviteToken,
      expiresAt,
      userExists: userResult.length > 0 && userResult[0].values.length > 0
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
};

// Accept invitation
const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    const db = getDb();

    const inviteResult = db.exec(`
      SELECT * FROM invite_tokens 
      WHERE token = '${token}' AND used = 0 AND expires_at > CURRENT_TIMESTAMP
    `);

    if (inviteResult.length === 0 || inviteResult[0].values.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const invite = inviteResult[0].values[0];
    const businessId = invite[1];
    const email = invite[2];
    const role = invite[3];

    // Find user by email
    const userResult = db.exec(`SELECT id FROM users WHERE email = '${email}'`);
    if (userResult.length === 0 || userResult[0].values.length === 0) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    const userId = userResult[0].values[0][0];

    // Add user to business
    const buId = uuidv4();
    db.run(`
      INSERT INTO business_users (id, business_id, user_id, role, joined_at)
      VALUES ('${buId}', '${businessId}', '${userId}', '${role}', CURRENT_TIMESTAMP)
    `);

    // Mark invite as used
    db.run(`UPDATE invite_tokens SET used = 1 WHERE token = '${token}'`);

    saveDatabase();

    res.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { businessId, userId } = req.params;
    const { role } = req.body;

    const validRoles = ['viewer', 'creator', 'reviewer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const db = getDb();

    // Check permissions
    const checkerResult = db.exec(`
      SELECT role FROM business_users 
      WHERE business_id = '${businessId}' AND user_id = '${req.user.id}'
    `);

    if (checkerResult.length === 0 || checkerResult[0].values.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checkerRole = checkerResult[0].values[0][0];
    if (checkerRole !== 'owner' && checkerRole !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Cannot change owner role
    const targetResult = db.exec(`
      SELECT role FROM business_users 
      WHERE business_id = '${businessId}' AND user_id = '${userId}'
    `);

    if (targetResult.length > 0 && targetResult[0].values.length > 0 && targetResult[0].values[0][0] === 'owner') {
      return res.status(403).json({ error: 'Cannot change owner role' });
    }

    db.run(`
      UPDATE business_users SET role = '${role}'
      WHERE business_id = '${businessId}' AND user_id = '${userId}'
    `);

    saveDatabase();

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Remove user from business
const removeUser = async (req, res) => {
  try {
    const { businessId, userId } = req.params;
    const db = getDb();

    // Check permissions
    const checkerResult = db.exec(`
      SELECT role FROM business_users 
      WHERE business_id = '${businessId}' AND user_id = '${req.user.id}'
    `);

    if (checkerResult.length === 0 || checkerResult[0].values.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checkerRole = checkerResult[0].values[0][0];
    if (checkerRole !== 'owner' && checkerRole !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Cannot remove owner
    const targetResult = db.exec(`
      SELECT role FROM business_users 
      WHERE business_id = '${businessId}' AND user_id = '${userId}'
    `);

    if (targetResult.length > 0 && targetResult[0].values.length > 0 && targetResult[0].values[0][0] === 'owner') {
      return res.status(403).json({ error: 'Cannot remove owner' });
    }

    db.run(`DELETE FROM business_users WHERE business_id = '${businessId}' AND user_id = '${userId}'`);
    saveDatabase();

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
};

module.exports = {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessUsers,
  inviteUser,
  acceptInvite,
  updateUserRole,
  removeUser
};
