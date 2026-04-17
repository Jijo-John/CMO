import db from '../config/db.js';

export const getContent = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const { status, platform, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT DISTINCT c.*, u.full_name as created_by_name
      FROM content c
      JOIN users u ON c.created_by = u.id
      WHERE c.business_id = ?
    `;
    
    const params = [businessId];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (platform) {
      query += ` 
        AND c.id IN (
          SELECT content_id FROM content_platforms WHERE platform_id = ?
        )
      `;
      params.push(platform);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const stmt = db.prepare(query);
    stmt.bind(params);
    
    const contentList = [];
    while (stmt.step()) {
      const item = stmt.getAsObject();
      
      // Get platforms for this content
      const platformStmt = db.prepare(`
        SELECT p.id, p.name, p.brand_color, cp.platform_specific_caption, cp.platform_specific_hashtags
        FROM platforms p
        JOIN content_platforms cp ON p.id = cp.platform_id
        WHERE cp.content_id = ?
      `);
      platformStmt.bind([item.c_id]);
      
      const platforms = [];
      while (platformStmt.step()) {
        const plat = platformStmt.getAsObject();
        platforms.push({
          id: plat.p_id,
          name: plat.p_name,
          brandColor: plat.p_brand_color,
          specificCaption: plat.cp_platform_specific_caption,
          specificHashtags: plat.cp_platform_specific_hashtags
        });
      }
      platformStmt.free();

      // Get media for this content
      const mediaStmt = db.prepare(`
        SELECT m.*, cm.sort_order
        FROM media m
        JOIN content_media cm ON m.id = cm.media_id
        WHERE cm.content_id = ?
        ORDER BY cm.sort_order
      `);
      mediaStmt.bind([item.c_id]);
      
      const mediaItems = [];
      while (mediaStmt.step()) {
        const media = mediaStmt.getAsObject();
        mediaItems.push({
          id: media.m_id,
          fileName: media.m_file_name,
          fileUrl: media.m_file_url,
          fileType: media.m_file_type,
          mimeType: media.m_mime_type,
          sortOrder: media.cm_sort_order
        });
      }
      mediaStmt.free();

      contentList.push({
        id: item.c_id,
        title: item.c_title,
        caption: item.c_caption,
        hashtags: item.c_hashtags,
        status: item.c_status,
        scheduledFor: item.c_scheduled_for,
        postedAt: item.c_posted_at,
        createdAt: item.c_created_at,
        createdBy: {
          id: item.c_created_by,
          fullName: item.created_by_name
        },
        platforms,
        media: mediaItems
      });
    }
    stmt.free();

    // Get total count
    let countQuery = 'SELECT COUNT(DISTINCT c.id) as total FROM content c WHERE c.business_id = ?';
    const countParams = [businessId];
    
    if (status) {
      countQuery += ' AND c.status = ?';
      countParams.push(status);
    }
    
    const countStmt = db.prepare(countQuery);
    countStmt.bind(countParams);
    countStmt.step();
    const total = countStmt.getAsObject().total;
    countStmt.free();

    res.json({
      content: contentList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};

export const getContentById = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const contentId = req.params.id;

    const stmt = db.prepare(`
      SELECT c.*, u.full_name as created_by_name
      FROM content c
      JOIN users u ON c.created_by = u.id
      WHERE c.id = ? AND c.business_id = ?
    `);
    
    stmt.bind([contentId, businessId]);
    
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const item = stmt.getAsObject();
    stmt.free();

    // Get platforms
    const platformStmt = db.prepare(`
      SELECT p.id, p.name, p.brand_color, cp.platform_specific_caption, cp.platform_specific_hashtags
      FROM platforms p
      JOIN content_platforms cp ON p.id = cp.platform_id
      WHERE cp.content_id = ?
    `);
    platformStmt.bind([contentId]);
    
    const platforms = [];
    while (platformStmt.step()) {
      const plat = platformStmt.getAsObject();
      platforms.push({
        id: plat.p_id,
        name: plat.p_name,
        brandColor: plat.p_brand_color,
        specificCaption: plat.cp_platform_specific_caption,
        specificHashtags: plat.cp_platform_specific_hashtags
      });
    }
    platformStmt.free();

    // Get media
    const mediaStmt = db.prepare(`
      SELECT m.*, cm.sort_order
      FROM media m
      JOIN content_media cm ON m.id = cm.media_id
      WHERE cm.content_id = ?
      ORDER BY cm.sort_order
    `);
    mediaStmt.bind([contentId]);
    
    const mediaItems = [];
    while (mediaStmt.step()) {
      const media = mediaStmt.getAsObject();
      mediaItems.push({
        id: media.m_id,
        fileName: media.m_file_name,
        fileUrl: media.m_file_url,
        fileType: media.m_file_type,
        mimeType: media.m_mime_type,
        sortOrder: media.cm_sort_order
      });
    }
    mediaStmt.free();

    // Get activity log
    const activityStmt = db.prepare(`
      SELECT a.*, u.full_name as user_name
      FROM activity_logs a
      JOIN users u ON a.user_id = u.id
      WHERE a.entity_type = 'content' AND a.entity_id = ?
      ORDER BY a.created_at DESC
      LIMIT 20
    `);
    activityStmt.bind([contentId]);
    
    const activities = [];
    while (activityStmt.step()) {
      const act = activityStmt.getAsObject();
      activities.push({
        action: act.a_action,
        userName: act.user_name,
        createdAt: act.a_created_at,
        details: act.a_details
      });
    }
    activityStmt.free();

    res.json({
      content: {
        id: item.c_id,
        title: item.c_title,
        caption: item.c_caption,
        hashtags: item.c_hashtags,
        status: item.c_status,
        scheduledFor: item.c_scheduled_for,
        postedAt: item.c_posted_at,
        rejectionReason: item.c_rejection_reason,
        createdAt: item.c_created_at,
        updatedAt: item.c_updated_at,
        createdBy: {
          id: item.c_created_by,
          fullName: item.created_by_name
        },
        approvedBy: item.c_approved_by,
        rejectedBy: item.c_rejected_by,
        platforms,
        media: mediaItems,
        activities
      }
    });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};

export const createContent = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const { title, caption, hashtags, platformIds, scheduledFor, mediaIds } = req.body;

    if (!title || !platformIds || platformIds.length === 0) {
      return res.status(400).json({ error: 'Title and at least one platform are required' });
    }

    db.run('BEGIN TRANSACTION');
    
    try {
      // Insert content
      const insertStmt = db.prepare(`
        INSERT INTO content (business_id, title, caption, hashtags, status, scheduled_for, created_by)
        VALUES (?, ?, ?, ?, 'draft', ?, ?)
      `);
      
      insertStmt.run([
        businessId, 
        title, 
        caption || null, 
        hashtags || null, 
        scheduledFor || null, 
        req.user.id
      ]);
      
      // Get content ID
      const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
      lastIdStmt.step();
      const contentId = lastIdStmt.getAsObject().id;
      lastIdStmt.free();

      // Insert content-platform relationships
      const platformStmt = db.prepare(`
        INSERT INTO content_platforms (content_id, platform_id)
        VALUES (?, ?)
      `);
      
      for (const platformId of platformIds) {
        platformStmt.run([contentId, platformId]);
      }
      platformStmt.free();

      // Insert content-media relationships
      if (mediaIds && mediaIds.length > 0) {
        const mediaStmt = db.prepare(`
          INSERT INTO content_media (content_id, media_id, sort_order)
          VALUES (?, ?, ?)
        `);
        
        mediaIds.forEach((mediaId, index) => {
          mediaStmt.run([contentId, mediaId, index]);
        });
        mediaStmt.free();
      }

      db.run('COMMIT');

      // Log activity
      const logStmt = db.prepare(`
        INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, 'content_created', 'content', ?, ?)
      `);
      logStmt.run([
        businessId, 
        req.user.id, 
        contentId, 
        JSON.stringify({ title })
      ]);
      logStmt.free();

      res.status(201).json({
        message: 'Content created successfully',
        contentId
      });
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
};

export const updateContent = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const contentId = req.params.id;
    const { title, caption, hashtags, platformIds, scheduledFor, status } = req.body;

    // Check if content exists and user has access
    const checkStmt = db.prepare(`
      SELECT status FROM content WHERE id = ? AND business_id = ?
    `);
    checkStmt.bind([contentId, businessId]);
    
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const currentStatus = checkStmt.getAsObject().status;
    checkStmt.free();

    // Only draft and rejected can be edited
    if (!['draft', 'rejected'].includes(currentStatus)) {
      return res.status(400).json({ 
        error: 'Only draft or rejected content can be edited' 
      });
    }

    // Update content
    const updateStmt = db.prepare(`
      UPDATE content 
      SET title = COALESCE(?, title),
          caption = COALESCE(?, caption),
          hashtags = COALESCE(?, hashtags),
          scheduled_for = COALESCE(?, scheduled_for),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    updateStmt.run([title, caption, hashtags, scheduledFor, contentId]);

    // Update platforms if provided
    if (platformIds) {
      // Delete existing
      const deleteStmt = db.prepare('DELETE FROM content_platforms WHERE content_id = ?');
      deleteStmt.run([contentId]);
      
      // Insert new
      const platformStmt = db.prepare(`
        INSERT INTO content_platforms (content_id, platform_id)
        VALUES (?, ?)
      `);
      
      for (const platformId of platformIds) {
        platformStmt.run([contentId, platformId]);
      }
      platformStmt.free();
    }

    // Log activity
    const logStmt = db.prepare(`
      INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, 'content_updated', 'content', ?)
    `);
    logStmt.run([businessId, req.user.id, contentId]);
    logStmt.free();

    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
};

export const submitForReview = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const contentId = req.params.id;

    const updateStmt = db.prepare(`
      UPDATE content 
      SET status = 'review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND business_id = ? AND status = 'draft'
    `);
    
    updateStmt.run([contentId, businessId]);

    // Log activity
    const logStmt = db.prepare(`
      INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, 'content_submitted', 'content', ?)
    `);
    logStmt.run([businessId, req.user.id, contentId]);
    logStmt.free();

    res.json({ message: 'Content submitted for review' });
  } catch (error) {
    console.error('Submit for review error:', error);
    res.status(500).json({ error: 'Failed to submit for review' });
  }
};

export const approveContent = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const contentId = req.params.id;

    const updateStmt = db.prepare(`
      UPDATE content 
      SET status = 'approved', approved_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND business_id = ? AND status = 'review'
    `);
    
    updateStmt.run([req.user.id, contentId, businessId]);

    // Log activity
    const logStmt = db.prepare(`
      INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, 'content_approved', 'content', ?)
    `);
    logStmt.run([businessId, req.user.id, contentId]);
    logStmt.free();

    res.json({ message: 'Content approved' });
  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({ error: 'Failed to approve content' });
  }
};

export const rejectContent = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const contentId = req.params.id;
    const { reason } = req.body;

    const updateStmt = db.prepare(`
      UPDATE content 
      SET status = 'rejected', rejected_by = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND business_id = ? AND status = 'review'
    `);
    
    updateStmt.run([req.user.id, reason || null, contentId, businessId]);

    // Log activity
    const logStmt = db.prepare(`
      INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'content_rejected', 'content', ?, ?)
    `);
    logStmt.run([
      businessId, 
      req.user.id, 
      contentId, 
      JSON.stringify({ reason })
    ]);
    logStmt.free();

    res.json({ message: 'Content rejected' });
  } catch (error) {
    console.error('Reject content error:', error);
    res.status(500).json({ error: 'Failed to reject content' });
  }
};

export const markAsPosted = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const contentId = req.params.id;

    const updateStmt = db.prepare(`
      UPDATE content 
      SET status = 'posted', posted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND business_id = ? AND status = 'approved'
    `);
    
    updateStmt.run([contentId, businessId]);

    // Log activity
    const logStmt = db.prepare(`
      INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, 'content_posted', 'content', ?)
    `);
    logStmt.run([businessId, req.user.id, contentId]);
    logStmt.free();

    res.json({ message: 'Content marked as posted' });
  } catch (error) {
    console.error('Mark as posted error:', error);
    res.status(500).json({ error: 'Failed to mark as posted' });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const contentId = req.params.id;

    const deleteStmt = db.prepare(`
      DELETE FROM content WHERE id = ? AND business_id = ? AND status = 'draft'
    `);
    
    deleteStmt.run([contentId, businessId]);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
};

export default {
  getContent,
  getContentById,
  createContent,
  updateContent,
  submitForReview,
  approveContent,
  rejectContent,
  markAsPosted,
  deleteContent
};
