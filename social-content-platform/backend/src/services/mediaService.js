const fs = require('fs');
const path = require('path');
const { generateId } = require('../utils/validation');
const { query, mutate } = require('../config/database');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Save uploaded file
function saveFile(file, contentId) {
  ensureUploadDir();
  
  const mediaId = generateId();
  const ext = path.extname(file.originalname);
  const filename = `${mediaId}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  
  // Move file to upload directory
  fs.writeFileSync(filepath, file.buffer);
  
  // Generate URL
  const url = `/api/media/${filename}`;
  
  // Store in database
  mutate(
    `INSERT INTO media (id, content_id, filename, original_name, mime_type, size, url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mediaId, contentId, filename, file.originalname, file.mimetype, file.size, url]
  );
  
  return {
    id: mediaId,
    filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url
  };
}

// Get media by ID
function getMediaById(mediaId) {
  const media = query('SELECT * FROM media WHERE id = ?', [mediaId]);
  return media.length > 0 ? media[0] : null;
}

// Get all media for a content item
function getMediaForContent(contentId) {
  return query('SELECT * FROM media WHERE content_id = ?', [contentId]);
}

// Get all media for a business (for media library)
function getMediaForBusiness(businessId, filters = {}) {
  let sql = `
    SELECT m.*, c.title as content_title
    FROM media m
    JOIN content c ON m.content_id = c.id
    WHERE c.business_id = ?
  `;
  
  const params = [businessId];
  
  if (filters.search) {
    sql += ' AND (m.original_name LIKE ? OR c.title LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  sql += ' ORDER BY m.uploaded_at DESC';
  
  return query(sql, params);
}

// Delete media file
function deleteMedia(mediaId, businessId) {
  // Verify media belongs to business's content
  const media = query(`
    SELECT m.* FROM media m
    JOIN content c ON m.content_id = c.id
    WHERE m.id = ? AND c.business_id = ?
  `, [mediaId, businessId]);
  
  if (media.length === 0) {
    throw new Error('Media not found or access denied');
  }
  
  const mediaItem = media[0];
  
  // Delete physical file
  const filepath = path.join(UPLOAD_DIR, mediaItem.filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
  
  // Delete from database
  mutate('DELETE FROM media WHERE id = ?', [mediaId]);
  
  return { success: true };
}

// Download media file (get buffer)
function downloadMedia(mediaId) {
  const media = getMediaById(mediaId);
  
  if (!media) {
    throw new Error('Media not found');
  }
  
  const filepath = path.join(UPLOAD_DIR, media.filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error('File not found on disk');
  }
  
  return {
    buffer: fs.readFileSync(filepath),
    mimeType: media.mimeType,
    originalName: media.originalName
  };
}

// Replace media file
function replaceMedia(mediaId, newFile, businessId) {
  const media = query(`
    SELECT m.* FROM media m
    JOIN content c ON m.content_id = c.id
    WHERE m.id = ? AND c.business_id = ?
  `, [mediaId, businessId]);
  
  if (media.length === 0) {
    throw new Error('Media not found or access denied');
  }
  
  const existingMedia = media[0];
  
  // Delete old file
  const oldPath = path.join(UPLOAD_DIR, existingMedia.filename);
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }
  
  // Save new file with same filename
  const newPath = path.join(UPLOAD_DIR, existingMedia.filename);
  fs.writeFileSync(newPath, newFile.buffer);
  
  // Update database
  mutate(
    'UPDATE media SET mime_type = ?, size = ?, original_name = ? WHERE id = ?',
    [newFile.mimetype, newFile.size, newFile.originalname, mediaId]
  );
  
  return getMediaById(mediaId);
}

module.exports = {
  saveFile,
  getMediaById,
  getMediaForContent,
  getMediaForBusiness,
  deleteMedia,
  downloadMedia,
  replaceMedia,
  ensureUploadDir
};
