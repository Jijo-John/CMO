const { pool } = require('../config/database');

/**
 * Get all media for a business
 */
const getMedia = async (businessId, options = {}) => {
  const { fileType, limit = 20, offset = 0 } = options;
  
  let query = `
    SELECT m.*, u.full_name as uploader_name
    FROM media m
    LEFT JOIN users u ON m.uploaded_by = u.id
    WHERE m.business_id = $1
  `;
  
  const params = [businessId];
  let paramIndex = 2;
  
  if (fileType) {
    query += ` AND m.file_type = $${paramIndex}`;
    params.push(fileType);
    paramIndex++;
  }
  
  query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM media WHERE business_id = $1`;
  const countParams = [businessId];
  
  if (fileType) {
    countQuery += ` AND file_type = $2`;
    countParams.push(fileType);
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
 * Get media by ID
 */
const getMediaById = async (mediaId) => {
  const result = await pool.query(
    'SELECT * FROM media WHERE id = $1',
    [mediaId]
  );
  
  return result.rows[0] || null;
};

/**
 * Create media record
 */
const createMedia = async (data) => {
  const {
    businessId,
    fileName,
    originalName,
    filePath,
    fileUrl,
    fileType,
    mimeType,
    fileSize,
    uploadedById,
    width,
    height,
    duration,
  } = data;
  
  const result = await pool.query(
    `INSERT INTO media (
       business_id, file_name, original_name, file_path, file_url,
       file_type, mime_type, file_size, width, height, duration, uploaded_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      businessId,
      fileName,
      originalName,
      filePath,
      fileUrl,
      fileType,
      mimeType,
      fileSize,
      width,
      height,
      duration,
      uploadedById,
    ]
  );
  
  return result.rows[0];
};

/**
 * Delete media
 */
const deleteMedia = async (mediaId) => {
  await pool.query('DELETE FROM media WHERE id = $1', [mediaId]);
};

/**
 * Get user's businesses (for access verification)
 */
const getUserBusinesses = async (userId) => {
  const result = await pool.query(
    `SELECT b.* FROM businesses b
     JOIN business_users bu ON b.id = bu.business_id
     WHERE bu.user_id = $1`,
    [userId]
  );
  
  return result.rows;
};

module.exports = {
  getMedia,
  getMediaById,
  createMedia,
  deleteMedia,
  getUserBusinesses,
};
