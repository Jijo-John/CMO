const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authMiddleware, requireBusinessAccess, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get dashboard stats
router.get('/dashboard/:businessId/stats', requireBusinessAccess(), contentController.getDashboardStats);

// Business-specific content routes
router.get('/business/:businessId', requireBusinessAccess(), contentController.getContent);
router.post('/business/:businessId', requireBusinessAccess('creator'), contentController.createContent);

// Content-specific routes
router.get('/:contentId', contentController.getContentItem);
router.put('/:contentId', requireBusinessAccess('creator'), contentController.updateContent);
router.patch('/:contentId/status', requireBusinessAccess('reviewer'), contentController.updateContentStatus);
router.delete('/:contentId', requireBusinessAccess('admin'), contentController.deleteContent);

module.exports = router;
