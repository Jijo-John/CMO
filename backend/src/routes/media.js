const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const upload = require('../middleware/upload');
const { authMiddleware, requireBusinessAccess, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get platforms (no business context needed)
router.get('/platforms', mediaController.getPlatforms);

// Business-specific media routes
router.get('/business/:businessId', requireBusinessAccess(), mediaController.getMedia);
router.post('/business/:businessId/upload', requireBusinessAccess('creator'), upload.single('file'), mediaController.uploadMedia);
router.delete('/:mediaId', requireBusinessAccess('admin'), mediaController.deleteMedia);

// Calendar
router.get('/calendar/:businessId/events', requireBusinessAccess(), mediaController.getCalendarEvents);

module.exports = router;
