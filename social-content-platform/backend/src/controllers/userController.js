import db from '../config/db.js';

export const getTeamMembers = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;

    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.avatar_url,
        bu.role,
        bu.joined_at,
        bu.invited_at
      FROM users u
      JOIN business_users bu ON u.id = bu.user_id
      WHERE bu.business_id = ? AND bu.joined_at IS NOT NULL
      ORDER BY bu.role, u.full_name
    `);
    
    stmt.bind([businessId]);
    
    const members = [];
    while (stmt.step()) {
      const member = stmt.getAsObject();
      members.push({
        id: member.u_id,
        email: member.u_email,
        fullName: member.u_full_name,
        avatarUrl: member.u_avatar_url,
        role: member.bu_role,
        joinedAt: member.bu_joined_at,
        invitedAt: member.bu_invited_at
      });
    }
    stmt.free();

    res.json({ members });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const { email, role } = req.body;

    // Validate role
    const validRoles = ['admin', 'creator', 'reviewer', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists in business
    const checkStmt = db.prepare(`
      SELECT u.id FROM users u
      JOIN business_users bu ON u.id = bu.user_id
      WHERE bu.business_id = ? AND u.email = ?
    `);
    checkStmt.bind([businessId, email]);
    
    if (checkStmt.step()) {
      checkStmt.free();
      return res.status(409).json({ error: 'User is already a member of this business' });
    }
    checkStmt.free();

    // Generate invitation token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const insertStmt = db.prepare(`
      INSERT INTO invitations (business_id, email, role, token, invited_by, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run([businessId, email, role, token, req.user.id, expiresAt.toISOString()]);

    // In production, send email here
    // For now, return the token for testing
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        email,
        role,
        token, // Remove in production
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const userId = req.params.userId;
    const { role } = req.body;

    // Validate role
    const validRoles = ['admin', 'creator', 'reviewer', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user can update roles (owner or admin only)
    const currentRole = req.businessContext.role;
    if (!['owner', 'admin'].includes(currentRole)) {
      return res.status(403).json({ error: 'Only owners and admins can update roles' });
    }

    // Cannot change owner role
    const ownerCheckStmt = db.prepare(`
      SELECT role FROM business_users WHERE business_id = ? AND user_id = ?
    `);
    ownerCheckStmt.bind([businessId, userId]);
    
    if (ownerCheckStmt.step()) {
      const targetRole = ownerCheckStmt.getAsObject().role;
      ownerCheckStmt.free();
      
      if (targetRole === 'owner') {
        return res.status(403).json({ error: 'Cannot change owner role' });
      }
    } else {
      ownerCheckStmt.free();
      return res.status(404).json({ error: 'User not found in business' });
    }

    // Update role
    const updateStmt = db.prepare(`
      UPDATE business_users SET role = ? WHERE business_id = ? AND user_id = ?
    `);
    updateStmt.run([role, businessId, userId]);

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const removeMember = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const userId = req.params.userId;

    // Cannot remove yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Cannot remove owner
    const ownerCheckStmt = db.prepare(`
      SELECT role FROM business_users WHERE business_id = ? AND user_id = ?
    `);
    ownerCheckStmt.bind([businessId, userId]);
    
    if (ownerCheckStmt.step()) {
      const targetRole = ownerCheckStmt.getAsObject().role;
      ownerCheckStmt.free();
      
      if (targetRole === 'owner') {
        return res.status(403).json({ error: 'Cannot remove owner' });
      }
    } else {
      ownerCheckStmt.free();
      return res.status(404).json({ error: 'User not found in business' });
    }

    // Check if user can remove (owner or admin only)
    const currentRole = req.businessContext.role;
    if (!['owner', 'admin'].includes(currentRole)) {
      return res.status(403).json({ error: 'Only owners and admins can remove members' });
    }

    // Remove member
    const deleteStmt = db.prepare(`
      DELETE FROM business_users WHERE business_id = ? AND user_id = ?
    `);
    deleteStmt.run([businessId, userId]);

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    // Find invitation
    const inviteStmt = db.prepare(`
      SELECT * FROM invitations 
      WHERE token = ? AND expires_at > CURRENT_TIMESTAMP AND accepted_at IS NULL
    `);
    inviteStmt.bind([token]);
    
    if (!inviteStmt.step()) {
      inviteStmt.free();
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }
    
    const invitation = inviteStmt.getAsObject();
    inviteStmt.free();

    // Check if user exists
    const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    userStmt.bind([invitation.email]);
    
    let userId;
    if (userStmt.step()) {
      userId = userStmt.getAsObject().id;
    } else {
      // User needs to register first
      userStmt.free();
      return res.status(400).json({ 
        error: 'No account found with this email. Please register first.',
        requiresRegistration: true,
        email: invitation.email
      });
    }
    userStmt.free();

    // Add user to business
    db.run('BEGIN TRANSACTION');
    
    try {
      const addStmt = db.prepare(`
        INSERT OR REPLACE INTO business_users (business_id, user_id, role, joined_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);
      addStmt.run([invitation.business_id, userId, invitation.role]);

      // Mark invitation as accepted
      const acceptStmt = db.prepare(`
        UPDATE invitations SET accepted_at = CURRENT_TIMESTAMP WHERE token = ?
      `);
      acceptStmt.run([token]);

      db.run('COMMIT');

      res.json({ message: 'Invitation accepted successfully' });
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

export default { 
  getTeamMembers, 
  inviteMember, 
  updateMemberRole, 
  removeMember,
  acceptInvitation
};
