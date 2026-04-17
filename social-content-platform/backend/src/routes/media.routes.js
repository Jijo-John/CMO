const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mediaService = require('../services/media.service');
const contentService = require('../services/content.service');
const { authenticate } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { scopeToBusiness } = require('../middleware/business.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/businesses/:businessId/media/upload
 * Upload media file
 */
router.post(
  '/businesses/:businessId/media/upload',
  scopeToBusiness,
  checkRole(['owner', 'admin', 'creator']),
  upload.single('file'),
  handleMulterError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded.',
        });
      }
      
      const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const fileUrl = `/uploads/${req.file.filename}`;
      
      const media = await mediaService.createMedia({
        businessId: req.businessId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileUrl,
        fileType,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedById: req.user.id,
      });
      
      res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        data: media,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload file.',
      });
    }
  }
);

/**
 * GET /api/businesses/:businessId/media
 * Get all media for a business
 */
router.get('/businesses/:businessId/media', scopeToBusiness, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    
    const result = await mediaService.getMedia(req.businessId, {
      fileType: type,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    
    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch media.',
    });
  }
});

/**
 * GET /api/media/:id
 * Get media by ID
 */
router.get('/media/:id', async (req, res) => {
  try {
    const media = await mediaService.getMediaById(req.params.id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.',
      });
    }
    
    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch media.',
    });
  }
});

/**
 * GET /api/media/:id/download
 * Download media file
 */
router.get('/media/:id/download', async (req, res) => {
  try {
    const media = await mediaService.getMediaById(req.params.id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.',
      });
    }
    
    // Verify user has access to the business
    const businesses = await mediaService.getUserBusinesses(req.user.id);
    const hasAccess = businesses.some(b => b.id === media.business_id);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }
    
    const filePath = path.join(process.cwd(), media.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }
    
    res.download(filePath, media.original_name);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download media.',
    });
  }
});

/**
 * DELETE /api/businesses/:businessId/media/:id
 * Delete media (admin+ only)
 */
router.delete(
  '/businesses/:businessId/media/:id',
  scopeToBusiness,
  checkRole(['owner', 'admin']),
  async (req, res) => {
    try {
      const media = await mediaService.getMediaById(req.params.id);
      
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found.',
        });
      }
      
      // Delete file from disk
      if (fs.existsSync(media.file_path)) {
        fs.unlinkSync(media.file_path);
      }
      
      await mediaService.deleteMedia(req.params.id);
      
      res.json({
        success: true,
        message: 'Media deleted successfully.',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete media.',
      });
    }
  }
);

module.exports = router;
