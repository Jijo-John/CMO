const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/platforms - Get all platforms
router.get('/', (req, res) => {
  try {
    const platforms = query('SELECT * FROM platforms ORDER BY name');
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/platforms/:id - Get single platform
router.get('/:id', (req, res) => {
  try {
    const platforms = query('SELECT * FROM platforms WHERE id = ?', [req.params.id]);
    
    if (platforms.length === 0) {
      return res.status(404).json({ error: 'Platform not found' });
    }
    
    res.json(platforms[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
