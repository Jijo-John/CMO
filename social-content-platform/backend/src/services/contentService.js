const { generateId, isValidStatusTransition } = require('../utils/validation');
const { query, mutate } = require('../config/database');

// Create content item
function createContent(businessId, title, caption, hashtags, createdBy, platformIds = []) {
  const contentId = generateId();
  
  mutate(
    `INSERT INTO content (id, business_id, title, caption, hashtags, status, created_by) 
     VALUES (?, ?, ?, ?, ?, 'draft', ?)`,
    [contentId, businessId, title, caption || null, hashtags || null, createdBy]
  );
  
  // Add platform associations
  if (platformIds && platformIds.length > 0) {
    platformIds.forEach(platformId => {
      const cpId = generateId();
      mutate(
        'INSERT INTO content_platforms (id, content_id, platform_id) VALUES (?, ?, ?)',
        [cpId, contentId, platformId]
      );
    });
  }
  
  return getContentById(contentId);
}

// Get content by ID with platforms and media
function getContentById(contentId) {
  const content = query('SELECT * FROM content WHERE id = ?', [contentId]);
  
  if (content.length === 0) {
    return null;
  }
  
  const item = content[0];
  
  // Get associated platforms
  const platforms = query(`
    SELECT p.*, cp.platform_caption
    FROM platforms p
    JOIN content_platforms cp ON p.id = cp.platform_id
    WHERE cp.content_id = ?
  `, [contentId]);
  
  // Get media files
  const mediaFiles = query('SELECT * FROM media WHERE content_id = ?', [contentId]);
  
  return {
    ...item,
    platforms,
    media: mediaFiles
  };
}

// Get all content for a business with filters
function getContentForBusiness(businessId, filters = {}) {
  let sql = `
    SELECT c.*, u.name as creator_name
    FROM content c
    JOIN users u ON c.created_by = u.id
    WHERE c.business_id = ?
  `;
  
  const params = [businessId];
  
  if (filters.status) {
    sql += ' AND c.status = ?';
    params.push(filters.status);
  }
  
  if (filters.platformId) {
    sql += ` AND c.id IN (SELECT content_id FROM content_platforms WHERE platform_id = ?)`;
    params.push(filters.platformId);
  }
  
  if (filters.search) {
    sql += ' AND (c.title LIKE ? OR c.caption LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  sql += ' ORDER BY c.created_at DESC';
  
  const contentList = query(sql, params);
  
  // Enrich each item with platform and media count
  return contentList.map(item => {
    const platforms = query(`
      SELECT p.* FROM platforms p
      JOIN content_platforms cp ON p.id = cp.platform_id
      WHERE cp.content_id = ?
    `, [item.id]);
    
    const mediaCount = query('SELECT COUNT(*) as count FROM media WHERE content_id = ?', [item.id])[0].count;
    
    return {
      ...item,
      platforms,
      mediaCount: parseInt(mediaCount)
    };
  });
}

// Update content
function updateContent(contentId, updates, businessId) {
  // Verify content belongs to business
  const existing = query('SELECT * FROM content WHERE id = ? AND business_id = ?', [contentId, businessId]);
  if (existing.length === 0) {
    throw new Error('Content not found');
  }
  
  const fields = [];
  const values = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.caption !== undefined) {
    fields.push('caption = ?');
    values.push(updates.caption);
  }
  if (updates.hashtags !== undefined) {
    fields.push('hashtags = ?');
    values.push(updates.hashtags);
  }
  if (updates.scheduled_date !== undefined) {
    fields.push('scheduled_date = ?');
    values.push(updates.scheduled_date);
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(contentId);
  
  mutate(
    `UPDATE content SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );
  
  return getContentById(contentId);
}

// Update content status (workflow transition)
function updateContentStatus(contentId, newStatus, businessId) {
  const existing = query('SELECT status FROM content WHERE id = ? AND business_id = ?', [contentId, businessId]);
  
  if (existing.length === 0) {
    throw new Error('Content not found');
  }
  
  const currentStatus = existing[0].status;
  
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
  
  mutate('UPDATE content SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, contentId]);
  
  return getContentById(contentId);
}

// Add platform to content
function addPlatformToContent(contentId, platformId, platformCaption = null) {
  // Check if already assigned
  const existing = query(
    'SELECT id FROM content_platforms WHERE content_id = ? AND platform_id = ?',
    [contentId, platformId]
  );
  
  if (existing.length > 0) {
    throw new Error('Platform already assigned to content');
  }
  
  const cpId = generateId();
  mutate(
    'INSERT INTO content_platforms (id, content_id, platform_id, platform_caption) VALUES (?, ?, ?, ?)',
    [cpId, contentId, platformId, platformCaption]
  );
  
  return getContentById(contentId);
}

// Update platform-specific caption
function updatePlatformCaption(contentId, platformId, caption) {
  mutate(
    'UPDATE content_platforms SET platform_caption = ? WHERE content_id = ? AND platform_id = ?',
    [caption, contentId, platformId]
  );
  
  return getContentById(contentId);
}

// Remove platform from content
function removePlatformFromContent(contentId, platformId) {
  mutate('DELETE FROM content_platforms WHERE content_id = ? AND platform_id = ?', [contentId, platformId]);
  return getContentById(contentId);
}

// Delete content
function deleteContent(contentId, businessId) {
  // Verify ownership
  const existing = query('SELECT id FROM content WHERE id = ? AND business_id = ?', [contentId, businessId]);
  if (existing.length === 0) {
    throw new Error('Content not found');
  }
  
  // Delete related records
  mutate('DELETE FROM media WHERE content_id = ?', [contentId]);
  mutate('DELETE FROM content_platforms WHERE content_id = ?', [contentId]);
  mutate('DELETE FROM content WHERE id = ?', [contentId]);
  
  return { success: true };
}

// Get content statistics for dashboard
function getContentStats(businessId) {
  const stats = query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
      SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as in_review,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted
    FROM content
    WHERE business_id = ?
  `, [businessId]);
  
  return stats[0];
}

// Get upcoming scheduled content
function getUpcomingContent(businessId, days = 7) {
  return query(`
    SELECT c.*, u.name as creator_name
    FROM content c
    JOIN users u ON c.created_by = u.id
    WHERE c.business_id = ? 
      AND c.scheduled_date IS NOT NULL
      AND c.scheduled_date >= date('now')
      AND c.scheduled_date <= date('now', '+${days} days')
    ORDER BY c.scheduled_date ASC
  `, [businessId]);
}

module.exports = {
  createContent,
  getContentById,
  getContentForBusiness,
  updateContent,
  updateContentStatus,
  addPlatformToContent,
  updatePlatformCaption,
  removePlatformFromContent,
  deleteContent,
  getContentStats,
  getUpcomingContent
};
