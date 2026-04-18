const { v4: uuidv4 } = require('uuid');
const { getDb, saveDatabase } = require('../config/database');

// Get all content for a business
const getContent = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status, platform, search, page = 1, limit = 20 } = req.query;
    
    const db = getDb();
    let query = `
      SELECT DISTINCT c.*, u.name as creator_name
      FROM content c
      JOIN users u ON c.created_by = u.id
      WHERE c.business_id = '${businessId}'
    `;

    if (status) {
      query += ` AND c.status = '${status}'`;
    }

    if (platform) {
      query += ` AND c.id IN (SELECT content_id FROM content_platforms WHERE platform_id = '${platform}')`;
    }

    if (search) {
      query += ` AND (c.title LIKE '%${search}%' OR c.caption LIKE '%${search}%')`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = db.exec(query);
    
    const content = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      business_id: row[1],
      title: row[2],
      caption: row[3],
      hashtags: row[4],
      status: row[5],
      scheduled_date: row[6],
      posted_date: row[7],
      created_by: row[8],
      created_at: row[9],
      updated_at: row[10],
      creator_name: row[11]
    })) : [];

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};

// Get single content item
const getContentItem = async (req, res) => {
  try {
    const { contentId } = req.params;
    const db = getDb();

    const result = db.exec(`
      SELECT c.*, u.name as creator_name
      FROM content c
      JOIN users u ON c.created_by = u.id
      WHERE c.id = '${contentId}'
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const row = result[0].values[0];
    const content = {
      id: row[0],
      business_id: row[1],
      title: row[2],
      caption: row[3],
      hashtags: row[4],
      status: row[5],
      scheduled_date: row[6],
      posted_date: row[7],
      created_by: row[8],
      created_at: row[9],
      updated_at: row[10],
      creator_name: row[11]
    };

    // Get platforms
    const platformsResult = db.exec(`
      SELECT cp.*, p.name as platform_name, p.brand_color
      FROM content_platforms cp
      JOIN platforms p ON cp.platform_id = p.id
      WHERE cp.content_id = '${contentId}'
    `);

    content.platforms = platformsResult.length > 0 ? platformsResult[0].values.map(row => ({
      id: row[0],
      content_id: row[1],
      platform_id: row[2],
      platform_name: row[3],
      brand_color: row[4],
      platform_caption: row[5],
      platform_hashtags: row[6],
      is_posted: row[7],
      posted_at: row[8]
    })) : [];

    // Get media
    const mediaResult = db.exec(`
      SELECT m.*, cm.sort_order
      FROM media m
      JOIN content_media cm ON m.id = cm.media_id
      WHERE cm.content_id = '${contentId}'
      ORDER BY cm.sort_order
    `);

    content.media = mediaResult.length > 0 ? mediaResult[0].values.map(row => ({
      id: row[0],
      business_id: row[1],
      filename: row[2],
      original_name: row[3],
      mime_type: row[4],
      size: row[5],
      url: row[6],
      uploaded_by: row[7],
      created_at: row[8],
      sort_order: row[9]
    })) : [];

    res.json({ content });
  } catch (error) {
    console.error('Get content item error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};

// Create content
const createContent = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { title, caption, hashtags, platformIds, mediaIds, scheduledDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const db = getDb();
    const contentId = uuidv4();

    db.run(`
      INSERT INTO content (id, business_id, title, caption, hashtags, created_by, scheduled_date)
      VALUES ('${contentId}', '${businessId}', '${title}', '${caption || ''}', '${hashtags || ''}', '${req.user.id}', ${scheduledDate ? `'${scheduledDate}'` : 'NULL'})
    `);

    // Add platforms
    if (platformIds && Array.isArray(platformIds)) {
      for (const platformId of platformIds) {
        const cpId = uuidv4();
        db.run(`
          INSERT INTO content_platforms (id, content_id, platform_id)
          VALUES ('${cpId}', '${contentId}', '${platformId}')
        `);
      }
    }

    // Add media
    if (mediaIds && Array.isArray(mediaIds)) {
      for (let i = 0; i < mediaIds.length; i++) {
        const cmId = uuidv4();
        db.run(`
          INSERT INTO content_media (id, content_id, media_id, sort_order)
          VALUES ('${cmId}', '${contentId}', '${mediaIds[i]}', ${i})
        `);
      }
    }

    // Log activity
    const logId = uuidv4();
    db.run(`
      INSERT INTO activity_logs (id, business_id, user_id, action, entity_type, entity_id, details)
      VALUES ('${logId}', '${businessId}', '${req.user.id}', 'created', 'content', '${contentId}', 'Content created: ${title}')
    `);

    saveDatabase();

    res.status(201).json({
      message: 'Content created successfully',
      content: {
        id: contentId,
        title,
        business_id: businessId
      }
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
};

// Update content
const updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title, caption, hashtags, platformIds, mediaIds, scheduledDate } = req.body;

    const db = getDb();

    // Verify content exists and belongs to business
    const contentCheck = db.exec(`SELECT business_id FROM content WHERE id = '${contentId}'`);
    if (contentCheck.length === 0 || contentCheck[0].values.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const businessId = contentCheck[0].values[0][0];

    const updates = [];
    if (title) updates.push(`title = '${title}'`);
    if (caption !== undefined) updates.push(`caption = '${caption}'`);
    if (hashtags !== undefined) updates.push(`hashtags = '${hashtags}'`);
    if (scheduledDate !== undefined) updates.push(`scheduled_date = ${scheduledDate ? `'${scheduledDate}'` : 'NULL'}`);
    
    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      db.run(`UPDATE content SET ${updates.join(', ')} WHERE id = '${contentId}'`);
    }

    // Update platforms if provided
    if (platformIds && Array.isArray(platformIds)) {
      db.run(`DELETE FROM content_platforms WHERE content_id = '${contentId}'`);
      for (const platformId of platformIds) {
        const cpId = uuidv4();
        db.run(`
          INSERT INTO content_platforms (id, content_id, platform_id)
          VALUES ('${cpId}', '${contentId}', '${platformId}')
        `);
      }
    }

    // Update media if provided
    if (mediaIds && Array.isArray(mediaIds)) {
      db.run(`DELETE FROM content_media WHERE content_id = '${contentId}'`);
      for (let i = 0; i < mediaIds.length; i++) {
        const cmId = uuidv4();
        db.run(`
          INSERT INTO content_media (id, content_id, media_id, sort_order)
          VALUES ('${cmId}', '${contentId}', '${mediaIds[i]}', ${i})
        `);
      }
    }

    saveDatabase();

    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
};

// Update content status
const updateContentStatus = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'review', 'approved', 'posted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = getDb();

    const updates = [`status = '${status}'`, `updated_at = CURRENT_TIMESTAMP`];
    
    if (status === 'posted') {
      updates.push(`posted_date = CURRENT_TIMESTAMP`);
    }

    db.run(`UPDATE content SET ${updates.join(', ')} WHERE id = '${contentId}'`);

    // Log activity
    const contentResult = db.exec(`SELECT business_id, title FROM content WHERE id = '${contentId}'`);
    if (contentResult.length > 0 && contentResult[0].values.length > 0) {
      const logId = uuidv4();
      const businessId = contentResult[0].values[0][0];
      const title = contentResult[0].values[0][1];
      
      db.run(`
        INSERT INTO activity_logs (id, business_id, user_id, action, entity_type, entity_id, details)
        VALUES ('${logId}', '${businessId}', '${req.user.id}', 'status_change', 'content', '${contentId}', 'Status changed to ${status}: ${title}')
      `);
    }

    saveDatabase();

    res.json({ message: 'Content status updated successfully' });
  } catch (error) {
    console.error('Update content status error:', error);
    res.status(500).json({ error: 'Failed to update content status' });
  }
};

// Delete content
const deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const db = getDb();

    // Get business_id for logging
    const contentResult = db.exec(`SELECT business_id, title FROM content WHERE id = '${contentId}'`);
    
    db.run(`DELETE FROM content WHERE id = '${contentId}'`);

    if (contentResult.length > 0 && contentResult[0].values.length > 0) {
      const logId = uuidv4();
      const businessId = contentResult[0].values[0][0];
      const title = contentResult[0].values[0][1];
      
      db.run(`
        INSERT INTO activity_logs (id, business_id, user_id, action, entity_type, entity_id, details)
        VALUES ('${logId}', '${businessId}', '${req.user.id}', 'deleted', 'content', '${contentId}', 'Content deleted: ${title}')
      `);
    }

    saveDatabase();

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const { businessId } = req.params;
    const db = getDb();

    const stats = {
      total: 0,
      draft: 0,
      review: 0,
      approved: 0,
      posted: 0,
      rejected: 0
    };

    const result = db.exec(`
      SELECT status, COUNT(*) as count
      FROM content
      WHERE business_id = '${businessId}'
      GROUP BY status
    `);

    if (result.length > 0) {
      result[0].values.forEach(row => {
        stats[row[0]] = row[1];
        stats.total += row[1];
      });
    }

    // Get recent activity
    const activityResult = db.exec(`
      SELECT al.*, u.name as user_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.business_id = '${businessId}'
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    stats.recentActivity = activityResult.length > 0 ? activityResult[0].values.map(row => ({
      id: row[0],
      action: row[3],
      entity_type: row[4],
      entity_id: row[5],
      details: row[6],
      created_at: row[7],
      user_name: row[8]
    })) : [];

    res.json({ stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = {
  getContent,
  getContentItem,
  createContent,
  updateContent,
  updateContentStatus,
  deleteContent,
  getDashboardStats
};
