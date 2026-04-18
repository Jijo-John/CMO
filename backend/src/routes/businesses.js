const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { authMiddleware, requireBusinessAccess, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get user's businesses
router.get('/', businessController.getBusinesses);

// Create new business
router.post('/', businessController.createBusiness);

// Business-specific routes
router.get('/:businessId', requireBusinessAccess(), businessController.getBusiness);
router.put('/:businessId', requireBusinessAccess('admin'), businessController.updateBusiness);
router.delete('/:businessId', requireBusinessAccess('owner'), businessController.deleteBusiness);

// Users management
router.get('/:businessId/users', requireBusinessAccess('admin'), businessController.getBusinessUsers);
router.post('/:businessId/users/invite', requireBusinessAccess('admin'), businessController.inviteUser);
router.post('/accept-invite', businessController.acceptInvite);
router.put('/:businessId/users/:userId/role', requireBusinessAccess('admin'), businessController.updateUserRole);
router.delete('/:businessId/users/:userId', requireBusinessAccess('admin'), businessController.removeUser);

module.exports = router;
