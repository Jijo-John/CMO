const express = require('express');
const router = express.Router();
const contentService = require('../services/content.service');
const { authenticate } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { scopeToBusiness } = require('../middleware/business.middleware');

// All routes require authentication and business scope
router.use(authenticate);
router.use(scopeToBusiness);

/**
 * GET /api/businesses/:businessId/content
 * Get all content for a business
 */
router.get('/content', async (req, res) => {
  try {
    const { status, platform, search, page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const result = await contentService.getContent(req.businessId, {
      status,
      platformId: platform,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch content.',
    });
  }
});

/**
 * GET /api/businesses/:businessId/content/:id
 * Get content by ID
 */
router.get('/content/:id', async (req, res) => {
  try {
    const content = await contentService.getContentById(req.params.id, req.businessId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found.',
      });
    }
    
    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch content.',
    });
  }
});

/**
 * POST /api/businesses/:businessId/content
 * Create new content (creator+ only)
 */
router.post('/content', checkRole(['owner', 'admin', 'creator']), async (req, res) => {
  try {
    const { title, caption, hashtags, scheduledDate, platformIds } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.',
      });
    }
    
    const content = await contentService.createContent({
      businessId: req.businessId,
      title,
      caption,
      hashtags,
      scheduledDate,
      platformIds,
      createdById: req.user.id,
    });
    
    res.status(201).json({
      success: true,
      message: 'Content created successfully.',
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create content.',
    });
  }
});

/**
 * PUT /api/businesses/:businessId/content/:id
 * Update content (creator+ only)
 */
router.put('/content/:id', checkRole(['owner', 'admin', 'creator']), async (req, res) => {
  try {
    const { title, caption, hashtags, scheduledDate } = req.body;
    
    const content = await contentService.updateContent(req.params.id, req.businessId, {
      title,
      caption,
      hashtags,
      scheduledDate,
    });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Content updated successfully.',
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update content.',
    });
  }
});

/**
 * DELETE /api/businesses/:businessId/content/:id
 * Delete content (creator+ only)
 */
router.delete('/content/:id', checkRole(['owner', 'admin', 'creator']), async (req, res) => {
  try {
    await contentService.deleteContent(req.params.id, req.businessId);
    
    res.json({
      success: true,
      message: 'Content deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete content.',
    });
  }
});

/**
 * POST /api/businesses/:businessId/content/:id/submit-review
 * Submit content for review (creator+ only)
 */
router.post('/content/:id/submit-review', checkRole(['owner', 'admin', 'creator']), async (req, res) => {
  try {
    const content = await contentService.submitForReview(req.params.id, req.businessId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Content submitted for review.',
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit for review.',
    });
  }
});

/**
 * POST /api/businesses/:businessId/content/:id/approve
 * Approve content (reviewer+ only)
 */
router.post('/content/:id/approve', checkRole(['owner', 'admin', 'reviewer']), async (req, res) => {
  try {
    const content = await contentService.approveContent(
      req.params.id,
      req.businessId,
      req.user.id
    );
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Content approved.',
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve content.',
    });
  }
});

/**
 * POST /api/businesses/:businessId/content/:id/reject
 * Reject content (reviewer+ only)
 */
router.post('/content/:id/reject', checkRole(['owner', 'admin', 'reviewer']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const content = await contentService.rejectContent(
      req.params.id,
      req.businessId,
      req.user.id,
      reason
    );
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Content rejected.',
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject content.',
    });
  }
});

/**
 * POST /api/businesses/:businessId/content/:id/mark-posted
 * Mark content as posted
 */
router.post('/content/:id/mark-posted', checkRole(['owner', 'admin', 'creator']), async (req, res) => {
  try {
    const { platformIds } = req.body;
    
    await contentService.markAsPosted(req.params.id, req.businessId, platformIds);
    
    res.json({
      success: true,
      message: 'Content marked as posted.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark as posted.',
    });
  }
});

module.exports = router;
