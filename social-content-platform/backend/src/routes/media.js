const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaService = require('../services/mediaService');
const { authenticate } = require('../middleware/auth');
const { requireCreator } = require('../middleware/roleCheck');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, MP4, MOV'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// POST /api/businesses/:businessId/media/upload - Upload media file
router.post('/businesses/:businessId/media/upload', requireCreator, upload.single('file'), (req, res) => {
  try {
    const { contentId } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ error: 'contentId is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const media = mediaService.saveFile(req.file, contentId);
    res.status(201).json(media);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/businesses/:businessId/media - Get all media for business
router.get('/businesses/:businessId/media', (req, res) => {
  try {
    const filters = {
      search: req.query.search
    };
    
    const media = mediaService.getMediaForBusiness(req.params.businessId, filters);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/media/:mediaId/download - Download media file
router.get('/media/:mediaId/download', (req, res) => {
  try {
    const result = mediaService.downloadMedia(req.params.mediaId);
    
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.originalName}"`);
    res.send(result.buffer);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE /api/media/:mediaId - Delete media file
router.delete('/media/:mediaId', requireCreator, (req, res) => {
  try {
    // Get businessId from query or body
    const businessId = req.query.businessId || req.body.businessId;
    
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }
    
    mediaService.deleteMedia(req.params.mediaId, businessId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
