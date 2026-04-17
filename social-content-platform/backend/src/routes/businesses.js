const express = require('express');
const router = express.Router();
const businessService = require('../services/businessService');
const { authenticate } = require('../middleware/auth');
const { requireOwner, requireAdmin } = require('../middleware/roleCheck');
const { scopeToBusiness } = require('../middleware/businessScope');

// All routes require authentication
router.use(authenticate);

// POST /api/businesses - Create new business
router.post('/', (req, res) => {
  try {
    const { name, logo } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }
    
    const business = businessService.createBusiness(name, req.user.id, logo || null);
    
    res.status(201).json(business);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/businesses - Get user's businesses
router.get('/', (req, res) => {
  try {
    const businesses = businessService.getUserBusinesses(req.user.id);
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/businesses/:businessId - Get single business
router.get('/:businessId', scopeToBusiness, (req, res) => {
  try {
    const business = businessService.getBusinessById(req.businessId);
    res.json(business);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// PUT /api/businesses/:businessId - Update business (owner/admin only)
router.put('/:businessId', scopeToBusiness, requireAdmin, (req, res) => {
  try {
    const { name, logo } = req.body;
    const business = businessService.updateBusiness(req.businessId, { name, logo });
    res.json(business);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/businesses/:businessId - Delete business (owner only)
router.delete('/:businessId', scopeToBusiness, requireOwner, (req, res) => {
  try {
    businessService.deleteBusiness(req.businessId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/businesses/:businessId/team - Get team members
router.get('/:businessId/team', scopeToBusiness, (req, res) => {
  try {
    const members = businessService.getTeamMembers(req.businessId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/businesses/:businessId/team/invite - Invite user to business
router.post('/:businessId/team/invite', scopeToBusiness, requireAdmin, (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required' });
    }
    
    businessService.inviteUser(req.businessId, userId, role);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/businesses/:businessId/team/:userId/role - Update user role
router.put('/:businessId/team/:userId/role', scopeToBusiness, requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    
    businessService.updateUserRole(req.businessId, req.params.userId, role);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/businesses/:businessId/team/:userId - Remove user from business
router.delete('/:businessId/team/:userId', scopeToBusiness, requireAdmin, (req, res) => {
  try {
    businessService.removeUserFromBusiness(req.businessId, req.params.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/businesses/:businessId/activity - Get activity logs
router.get('/:businessId/activity', scopeToBusiness, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = businessService.getActivityLogs(req.businessId, limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
