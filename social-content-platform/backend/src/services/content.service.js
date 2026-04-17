const { pool } = require('../config/database');

/**
 * Get all content for a business with filters
 */
const getContent = async (businessId, options = {}) => {
  const {
    status,
    platformId,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 20,
    offset = 0,
  } = options;
  
  let query = `
    SELECT DISTINCT c.*, 
           u.full_name as creator_name,
           array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as platforms
    FROM content c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN content_platforms cp ON c.id = cp.content_id
    LEFT JOIN platforms p ON cp.platform_id = p.id
    WHERE c.business_id = $1
  `;
  
  const params = [businessId];
  let paramIndex = 2;
  
  // Filter by status
  if (status) {
    query += ` AND c.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  // Filter by platform
  if (platformId) {
    query += ` AND cp.platform_id = $${paramIndex}`;
    params.push(platformId);
    paramIndex++;
  }
  
  // Search by title or caption
  if (search) {
    query += ` AND (c.title ILIKE $${paramIndex} OR c.caption ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  query += ` GROUP BY c.id, u.full_name`;
  query += ` ORDER BY c.${sortBy} ${sortOrder}`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  // Get total count
  let countQuery = `
    SELECT COUNT(DISTINCT c.id) as total
    FROM content c
    LEFT JOIN content_platforms cp ON c.id = cp.content_id
    WHERE c.business_id = $1
  `;
  
  const countParams = [businessId];
  let countParamIndex = 2;
  
  if (status) {
    countQuery += ` AND c.status = $${countParamIndex}`;
    countParams.push(status);
    countParamIndex++;
  }
  
  if (platformId) {
    countQuery += ` AND cp.platform_id = $${countParamIndex}`;
    countParams.push(platformId);
    countParamIndex++;
  }
  
  if (search) {
    countQuery += ` AND (c.title ILIKE $${countParamIndex} OR c.caption ILIKE $${countParamIndex})`;
    countParams.push(`%${search}%`);
  }
  
  const countResult = await pool.query(countQuery, countParams);
  
  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].total),
    limit,
    offset,
  };
};

/**
 * Get content by ID
 */
const getContentById = async (contentId, businessId) => {
  const result = await pool.query(
    `SELECT c.*, u.full_name as creator_name,
            r.full_name as reviewer_name
     FROM content c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN users r ON c.reviewed_by = r.id
     WHERE c.id = $1 AND c.business_id = $2`,
    [contentId, businessId]
  );
  
  if (result.rows.length === 0) return null;
  
  const content = result.rows[0];
  
  // Get associated platforms
  const platformsResult = await pool.query(
    `SELECT cp.*, p.name, p.brand_color, p.icon_placeholder
     FROM content_platforms cp
     JOIN platforms p ON cp.platform_id = p.id
     WHERE cp.content_id = $1`,
    [contentId]
  );
  
  content.platforms = platformsResult.rows;
  
  // Get associated media
  const mediaResult = await pool.query(
    `SELECT cm.display_order, m.*
     FROM content_media cm
     JOIN media m ON cm.media_id = m.id
     WHERE cm.content_id = $1
     ORDER BY cm.display_order`,
    [contentId]
  );
  
  content.media = mediaResult.rows;
  
  return content;
};

/**
 * Create new content
 */
const createContent = async (data) => {
  const {
    businessId,
    title,
    caption,
    hashtags,
    scheduledDate,
    platformIds,
    createdById,
  } = data;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create content
    const contentResult = await client.query(
      `INSERT INTO content (business_id, title, caption, hashtags, scheduled_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [businessId, title, caption, hashtags, scheduledDate, createdById]
    );
    
    const content = contentResult.rows[0];
    
    // Add platform associations
    if (platformIds && platformIds.length > 0) {
      for (const platformId of platformIds) {
        await client.query(
          `INSERT INTO content_platforms (content_id, platform_id)
           VALUES ($1, $2)`,
          [content.id, platformId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    return content;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update content
 */
const updateContent = async (contentId, businessId, updates) => {
  const { title, caption, hashtags, scheduledDate } = updates;
  
  const result = await pool.query(
    `UPDATE content
     SET title = COALESCE($1, title),
         caption = COALESCE($2, caption),
         hashtags = COALESCE($3, hashtags),
         scheduled_date = COALESCE($4, scheduled_date),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND business_id = $6
     RETURNING *`,
    [title, caption, hashtags, scheduledDate, contentId, businessId]
  );
  
  return result.rows[0];
};

/**
 * Delete content
 */
const deleteContent = async (contentId, businessId) => {
  await pool.query(
    'DELETE FROM content WHERE id = $1 AND business_id = $2',
    [contentId, businessId]
  );
};

/**
 * Submit content for review
 */
const submitForReview = async (contentId, businessId) => {
  const result = await pool.query(
    `UPDATE content
     SET status = 'review',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND business_id = $2
     RETURNING *`,
    [contentId, businessId]
  );
  
  return result.rows[0];
};

/**
 * Approve content
 */
const approveContent = async (contentId, businessId, reviewedBy) => {
  const result = await pool.query(
    `UPDATE content
     SET status = 'approved',
         reviewed_by = $1,
         reviewed_at = CURRENT_TIMESTAMP,
         rejection_reason = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND business_id = $3
     RETURNING *`,
    [reviewedBy, contentId, businessId]
  );
  
  return result.rows[0];
};

/**
 * Reject content
 */
const rejectContent = async (contentId, businessId, reviewedBy, reason) => {
  const result = await pool.query(
    `UPDATE content
     SET status = 'rejected',
         reviewed_by = $1,
         reviewed_at = CURRENT_TIMESTAMP,
         rejection_reason = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND business_id = $4
     RETURNING *`,
    [reviewedBy, reason, contentId, businessId]
  );
  
  return result.rows[0];
};

/**
 * Mark content as posted
 */
const markAsPosted = async (contentId, businessId, platformIds = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    if (platformIds && platformIds.length > 0) {
      // Mark specific platforms as posted
      for (const platformId of platformIds) {
        await client.query(
          `UPDATE content_platforms
           SET is_posted = true,
               posted_at = CURRENT_TIMESTAMP
           WHERE content_id = $1 AND platform_id = $2`,
          [contentId, platformId]
        );
      }
      
      // Check if all platforms are posted
      const allPostedResult = await client.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN is_posted THEN 1 ELSE 0 END) as posted
         FROM content_platforms
         WHERE content_id = $1`,
        [contentId]
      );
      
      const { total, posted } = allPostedResult.rows[0];
      
      if (parseInt(total) === parseInt(posted)) {
        // All platforms posted, update content status
        await client.query(
          `UPDATE content
           SET status = 'posted',
               posted_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [contentId]
        );
      }
    } else {
      // Mark all platforms and content as posted
      await client.query(
        `UPDATE content_platforms
         SET is_posted = true,
             posted_at = CURRENT_TIMESTAMP
         WHERE content_id = $1`,
        [contentId]
      );
      
      await client.query(
        `UPDATE content
         SET status = 'posted',
             posted_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [contentId]
      );
    }
    
    await client.query('COMMIT');
    
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Add media to content
 */
const addMediaToContent = async (contentId, mediaId, displayOrder = 0) => {
  await pool.query(
    `INSERT INTO content_media (content_id, media_id, display_order)
     VALUES ($1, $2, $3)
     ON CONFLICT (content_id, media_id) DO NOTHING`,
    [contentId, mediaId, displayOrder]
  );
};

/**
 * Remove media from content
 */
const removeMediaFromContent = async (contentId, mediaId) => {
  await pool.query(
    'DELETE FROM content_media WHERE content_id = $1 AND media_id = $2',
    [contentId, mediaId]
  );
};

module.exports = {
  getContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  submitForReview,
  approveContent,
  rejectContent,
  markAsPosted,
  addMediaToContent,
  removeMediaFromContent,
};
