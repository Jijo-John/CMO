import db from '../config/db.js';

export const getMedia = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const { type, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT m.*, u.full_name as uploaded_by_name
      FROM media m
      JOIN users u ON m.uploaded_by = u.id
      WHERE m.business_id = ?
    `;
    
    const params = [businessId];

    if (type) {
      query += ' AND m.file_type = ?';
      params.push(type);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const stmt = db.prepare(query);
    stmt.bind(params);
    
    const mediaList = [];
    while (stmt.step()) {
      const item = stmt.getAsObject();
      mediaList.push({
        id: item.m_id,
        fileName: item.m_file_name,
        fileUrl: item.m_file_url,
        fileType: item.m_file_type,
        mimeType: item.m_mime_type,
        fileSize: item.m_file_size,
        width: item.m_width,
        height: item.m_height,
        createdAt: item.m_created_at,
        uploadedBy: {
          id: item.m_uploaded_by,
          fullName: item.uploaded_by_name
        }
      });
    }
    stmt.free();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM media WHERE business_id = ?';
    const countParams = [businessId];
    
    if (type) {
      countQuery += ' AND file_type = ?';
      countParams.push(type);
    }
    
    const countStmt = db.prepare(countQuery);
    countStmt.bind(countParams);
    countStmt.step();
    const total = countStmt.getAsObject().total;
    countStmt.free();

    res.json({
      media: mediaList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

export const uploadMedia = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, path, filename } = req.file;
    const fileType = mimetype.startsWith('video/') ? 'video' : 'image';
    const fileUrl = `/uploads/${fileType}s/${filename}`;

    // Insert media record
    const insertStmt = db.prepare(`
      INSERT INTO media (business_id, file_name, file_path, file_url, file_type, file_size, mime_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run([
      businessId,
      originalname,
      path,
      fileUrl,
      fileType,
      size,
      mimetype,
      req.user.id
    ]);

    // Get media ID
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const mediaId = lastIdStmt.getAsObject().id;
    lastIdStmt.free();

    res.status(201).json({
      message: 'Media uploaded successfully',
      media: {
        id: mediaId,
        fileName: originalname,
        fileUrl,
        fileType,
        fileSize: size,
        mimeType: mimetype
      }
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const businessId = req.businessContext.businessId;
    const mediaId = req.params.id;

    // Check if media exists and belongs to business
    const checkStmt = db.prepare(`
      SELECT file_path FROM media WHERE id = ? AND business_id = ?
    `);
    checkStmt.bind([mediaId, businessId]);
    
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Media not found' });
    }
    
    const media = checkStmt.getAsObject();
    checkStmt.free();

    // Delete from database (file cleanup can be done separately)
    const deleteStmt = db.prepare('DELETE FROM media WHERE id = ? AND business_id = ?');
    deleteStmt.run([mediaId, businessId]);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

export default { getMedia, uploadMedia, deleteMedia };
