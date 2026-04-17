const express = require('express');
const router = express.Router();
const contentService = require('../services/contentService');
const { authenticate } = require('../middleware/auth');
const { scopeToBusiness } = require('../middleware/businessScope');

// All routes require authentication
router.use(authenticate);

// GET /api/businesses/:businessId/calendar - Get calendar data
router.get('/businesses/:businessId/calendar', scopeToBusiness, (req, res) => {
  try {
    const { year, month, view } = req.query;
    
    let sql = `
      SELECT c.*, u.name as creator_name
      FROM content c
      JOIN users u ON c.created_by = u.id
      WHERE c.business_id = ?
    `;
    
    const params = [req.businessId];
    
    // Filter by date range based on view
    if (view === 'month' && year && month) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      sql += ` AND (
        (c.scheduled_date IS NOT NULL AND c.scheduled_date BETWEEN ? AND ?)
        OR (date(c.created_at) BETWEEN ? AND ?)
      )`;
      params.push(startDate, endDate, startDate, endDate);
    } else if (view === 'week' && year && month) {
      // Simple week filter (could be enhanced)
      sql += ` AND c.scheduled_date >= date(?) AND c.scheduled_date <= date(?, '+7 days')`;
      params.push(`${year}-${String(month).padStart(2, '0')}-01`, `${year}-${String(month).padStart(2, '0')}-01`);
    }
    
    sql += ' ORDER BY c.scheduled_date ASC, c.created_at DESC';
    
    const events = contentService.getContentForBusiness(req.businessId, {});
    
    // Transform for calendar use
    const calendarEvents = events.map(item => ({
      id: item.id,
      title: item.title,
      start: item.scheduled_date || item.created_at,
      end: item.scheduled_date || item.created_at,
      status: item.status,
      platforms: item.platforms,
      mediaCount: item.mediaCount,
      creatorName: item.creator_name,
      allDay: !item.scheduled_date
    }));
    
    res.json(calendarEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/:contentId/schedule - Update scheduled date
router.put('/content/:contentId/schedule', authenticate, (req, res) => {
  try {
    const { scheduledDate } = req.body;
    
    if (!scheduledDate) {
      return res.status(400).json({ error: 'scheduledDate is required' });
    }
    
    // Get content to verify business
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
    
    // Creator+ can schedule
    if (!['owner', 'admin', 'reviewer', 'creator'].includes(membership[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const updated = contentService.updateContent(req.params.contentId, { 
      scheduled_date: scheduledDate 
    }, content.business_id);
    
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
