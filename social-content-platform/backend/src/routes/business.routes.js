const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const businessService = require('../services/business.service');
const { authenticate } = require('../middleware/auth.middleware');
const { checkRole, isOwner } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/businesses
 * Get all businesses for current user
 */
router.get('/', async (req, res) => {
  try {
    const businesses = await businessService.getUserBusinesses(req.user.id);
    
    res.json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch businesses.',
    });
  }
});

/**
 * POST /api/businesses
 * Create a new business
 */
router.post('/', async (req, res) => {
  try {
    const { name, logoUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required.',
      });
    }
    
    const business = await businessService.createBusiness(req.user.id, name, logoUrl);
    
    res.status(201).json({
      success: true,
      message: 'Business created successfully.',
      data: business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create business.',
    });
  }
});

/**
 * GET /api/businesses/:businessId
 * Get business details
 */
router.get('/:businessId', async (req, res) => {
  try {
    const business = await businessService.getBusinessById(req.params.businessId);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      });
    }
    
    // Verify user has access
    const businessService_check = require('../services/business.service');
    const businesses = await businessService_check.getUserBusinesses(req.user.id);
    const hasAccess = businesses.some(b => b.id === req.params.businessId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }
    
    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch business.',
    });
  }
});

/**
 * PUT /api/businesses/:businessId
 * Update business
 */
router.put('/:businessId', checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const { name, logoUrl } = req.body;
    
    const business = await businessService.updateBusiness(req.params.businessId, { name, logoUrl });
    
    res.json({
      success: true,
      message: 'Business updated successfully.',
      data: business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update business.',
    });
  }
});

/**
 * DELETE /api/businesses/:businessId
 * Delete business (owner only)
 */
router.delete('/:businessId', isOwner, async (req, res) => {
  try {
    await businessService.deleteBusiness(req.params.businessId);
    
    res.json({
      success: true,
      message: 'Business deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete business.',
    });
  }
});

/**
 * GET /api/businesses/:businessId/members
 * Get business members
 */
router.get('/:businessId/members', checkRole(['owner', 'admin', 'creator', 'reviewer', 'viewer']), async (req, res) => {
  try {
    const members = await businessService.getBusinessMembers(req.params.businessId);
    
    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch members.',
    });
  }
});

/**
 * POST /api/businesses/:businessId/invite
 * Invite user to business
 */
router.post('/:businessId/invite', checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required.',
      });
    }
    
    const validRoles = ['owner', 'admin', 'creator', 'reviewer', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role.',
      });
    }
    
    const result = await businessService.inviteUser(
      req.params.businessId,
      email,
      role,
      req.user.id
    );
    
    res.json({
      success: true,
      message: result.invited 
        ? 'Invitation sent successfully.' 
        : 'User added to business successfully.',
      data: result,
    });
  } catch (error) {
    if (error.message === 'User is already a member of this business.') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to invite user.',
    });
  }
});

/**
 * PUT /api/businesses/:businessId/users/:userId/role
 * Update user role
 */
router.put('/:businessId/users/:userId/role', checkRole(['owner', 'admin']), async (req, res) => {
  try {
    const { role } = req.body;
    
    const validRoles = ['owner', 'admin', 'creator', 'reviewer', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role.',
      });
    }
    
    const result = await businessService.updateUserRole(
      req.params.businessId,
      req.params.userId,
      role
    );
    
    res.json({
      success: true,
      message: 'User role updated successfully.',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user role.',
    });
  }
});

/**
 * DELETE /api/businesses/:businessId/users/:userId
 * Remove user from business
 */
router.delete('/:businessId/users/:userId', checkRole(['owner', 'admin']), async (req, res) => {
  try {
    await businessService.removeUserFromBusiness(req.params.businessId, req.params.userId);
    
    res.json({
      success: true,
      message: 'User removed from business successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove user.',
    });
  }
});

module.exports = router;
