const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { getDb, saveDatabase } = require('../config/database');

// Get all media for a business
const getMedia = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { type, page = 1, limit = 50 } = req.query;
    
    const db = getDb();
    let query = `
      SELECT m.*, u.name as uploader_name
      FROM media m
      JOIN users u ON m.uploaded_by = u.id
      WHERE m.business_id = '${businessId}'
    `;

    if (type) {
      query += ` AND m.mime_type LIKE '${type}/%'`;
    }

    query += ` ORDER BY m.created_at DESC`;

    const result = db.exec(query);
    
    const media = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      business_id: row[1],
      filename: row[2],
      original_name: row[3],
      mime_type: row[4],
      size: row[5],
      url: row[6],
      uploaded_by: row[7],
      created_at: row[8],
      uploader_name: row[9]
    })) : [];

    res.json({ media });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

// Upload media
const uploadMedia = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = getDb();
    const mediaId = uuidv4();
    const fileUrl = `/uploads/${req.file.filename}`;

    db.run(`
      INSERT INTO media (id, business_id, filename, original_name, mime_type, size, url, uploaded_by)
      VALUES ('${mediaId}', '${businessId}', '${req.file.filename}', '${req.file.originalname}', '${req.file.mimetype}', ${req.file.size}, '${fileUrl}', '${req.user.id}')
    `);

    // Log activity
    const logId = uuidv4();
    db.run(`
      INSERT INTO activity_logs (id, business_id, user_id, action, entity_type, entity_id, details)
      VALUES ('${logId}', '${businessId}', '${req.user.id}', 'uploaded', 'media', '${mediaId}', 'Media uploaded: ${req.file.originalname}')
    `);

    saveDatabase();

    res.status(201).json({
      message: 'Media uploaded successfully',
      media: {
        id: mediaId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

// Delete media
const deleteMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const db = getDb();

    // Get media info for file deletion and logging
    const mediaResult = db.exec(`SELECT filename, original_name, business_id FROM media WHERE id = '${mediaId}'`);
    
    if (mediaResult.length > 0 && mediaResult[0].values.length > 0) {
      const filename = mediaResult[0].values[0][0];
      const originalName = mediaResult[0].values[0][1];
      const businessId = mediaResult[0].values[0][2];

      // Delete physical file
      const filePath = path.join(process.env.UPLOAD_DIR || './uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Log activity
      const logId = uuidv4();
      db.run(`
        INSERT INTO activity_logs (id, business_id, user_id, action, entity_type, entity_id, details)
        VALUES ('${logId}', '${businessId}', '${req.user.id}', 'deleted', 'media', '${mediaId}', 'Media deleted: ${originalName}')
      `);
    }

    db.run(`DELETE FROM media WHERE id = '${mediaId}'`);
    saveDatabase();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

// Get platforms
const getPlatforms = async (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(`SELECT * FROM platforms WHERE is_active = 1 ORDER BY name`);

    const platforms = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      brand_color: row[2],
      icon_placeholder: row[3],
      content_rules: row[4] ? JSON.parse(row[4]) : null,
      is_active: row[5],
      created_at: row[6]
    })) : [];

    res.json({ platforms });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
};

// Get calendar events
const getCalendarEvents = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { year, month } = req.query;
    
    const db = getDb();
    
    let query = `
      SELECT c.id, c.title, c.status, c.scheduled_date, c.posted_date,
             GROUP_CONCAT(p.id || '|' || p.name || '|' || p.brand_color) as platforms
      FROM content c
      LEFT JOIN content_platforms cp ON c.id = cp.content_id
      LEFT JOIN platforms p ON cp.platform_id = p.id
      WHERE c.business_id = '${businessId}'
    `;

    if (year && month) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query += ` AND (c.scheduled_date BETWEEN '${startDate}' AND '${endDate}' OR c.posted_date BETWEEN '${startDate}' AND '${endDate}')`;
    }

    query += ` GROUP BY c.id ORDER BY c.scheduled_date ASC, c.created_at DESC`;

    const result = db.exec(query);

    const events = result.length > 0 ? result[0].values.map(row => {
      const platformList = row[4] ? row[4].split(',').map(p => {
        const [id, name, color] = p.split('|');
        return { id, name, color };
      }) : [];

      return {
        id: row[0],
        title: row[1],
        status: row[2],
        scheduled_date: row[3],
        posted_date: row[4],
        platforms: platformList
      };
    }) : [];

    res.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

module.exports = {
  getMedia,
  uploadMedia,
  deleteMedia,
  getPlatforms,
  getCalendarEvents
};
