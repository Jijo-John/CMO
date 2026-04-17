const express = require('express');
const router = express.Router();
const contentService = require('../services/contentService');
const { authenticate } = require('../middleware/auth');
const { requireCreator, requireReviewer } = require('../middleware/roleCheck');
const { scopeToBusiness } = require('../middleware/businessScope');

// All routes require authentication
router.use(authenticate);

// GET /api/businesses/:businessId/content - Get all content for business
router.get('/businesses/:businessId/content', scopeToBusiness, (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      platformId: req.query.platformId,
      search: req.query.search
    };
    
    const content = contentService.getContentForBusiness(req.businessId, filters);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/businesses/:businessId/content/stats - Get content statistics
router.get('/businesses/:businessId/content/stats', scopeToBusiness, (req, res) => {
  try {
    const stats = contentService.getContentStats(req.businessId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/businesses/:businessId/content - Create new content (creator+)
router.post('/businesses/:businessId/content', scopeToBusiness, requireCreator, (req, res) => {
  try {
    const { title, caption, hashtags, platformIds } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const content = contentService.createContent(
      req.businessId,
      title,
      caption,
      hashtags,
      req.user.id,
      platformIds || []
    );
    
    res.status(201).json(content);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/content/:contentId - Get single content item
router.get('/content/:contentId', authenticate, (req, res) => {
  try {
    const content = contentService.getContentById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Verify user has access to this content's business
    const membership = require('../config/database').query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, content.business_id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/:contentId - Update content (creator+)
router.put('/content/:contentId', authenticate, requireCreator, (req, res) => {
  try {
    // First get content to verify business
    const content = contentService.getContentById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Verify access
    const membership = require('../config/database').query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, content.business_id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updated = contentService.updateContent(req.params.contentId, req.body, content.business_id);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/content/:contentId/status - Update content status (workflow)
router.patch('/content/:contentId/status', authenticate, (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get content to verify business
    const content = contentService.getContentById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Verify access and permissions
    const membership = require('../config/database').query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, content.business_id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Reviewer+ can approve, Creator+ can submit for review
    if (status === 'approved' && !['owner', 'admin', 'reviewer'].includes(membership[0].role)) {
      return res.status(403).json({ error: 'Only reviewers can approve content' });
    }
    
    const updated = contentService.updateContentStatus(req.params.contentId, status, content.business_id);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/content/:contentId/platforms/:platformId - Add platform to content
router.post('/content/:contentId/platforms/:platformId', authenticate, requireCreator, (req, res) => {
  try {
    const content = contentService.getContentById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const membership = require('../config/database').query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, content.business_id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updated = contentService.addPlatformToContent(
      req.params.contentId,
      req.params.platformId,
      req.body.platformCaption || null
    );
    
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/content/:contentId/platforms/:platformId/caption - Update platform caption
router.put('/content/:contentId/platforms/:platformId/caption', authenticate, requireCreator, (req, res) => {
  try {
    const { caption } = req.body;
    
    const content = contentService.getContentById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const membership = require('../config/database').query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, content.business_id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updated = contentService.updatePlatformCaption(
      req.params.contentId,
      req.params.platformId,
      caption
    );
    
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/content/:contentId/platforms/:platformId - Remove platform from content
router.delete('/content/:contentId/platforms/:platformId', authenticate, requireCreator, (req, res) => {
  try {
    const content = contentService.getContentById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const membership = require('../config/database').query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, content.business_id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updated = contentService.removePlatformFromContent(
      req.params.contentId,
      req.params.platformId
    );
    
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/content/:contentId - Delete content (creator+)
router.delete('/content/:contentId', authenticate, requireCreator, (req, res) => {
  try {
    const content = contentService.getContentById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const membership = require('../config/database').query(
      'SELECT role FROM business_users WHERE user_id = ? AND business_id = ?',
      [req.user.id, content.business_id]
    );
    
    if (membership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    contentService.deleteContent(req.params.contentId, content.business_id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
