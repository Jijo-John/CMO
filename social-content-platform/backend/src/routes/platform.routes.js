const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/platforms
 * Get all platforms
 */
router.get('/platforms', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM platforms WHERE is_active = true ORDER BY name'
    );
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch platforms.',
    });
  }
});

/**
 * GET /api/platforms/:id
 * Get platform by ID
 */
router.get('/platforms/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM platforms WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch platform.',
    });
  }
});

module.exports = router;
