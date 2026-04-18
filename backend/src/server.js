require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { initDatabase, saveDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const contentRoutes = require('./routes/content');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/media', mediaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === 'SQLITE_ERROR') {
    return res.status(500).json({ error: 'Database error' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Save database on exit
const gracefulShutdown = async () => {
  console.log('\nSaving database before shutdown...');
  saveDatabase();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║     SocialFlow Backend Server Running         ║
╠═══════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}                       ║
║  API Base: http://localhost:${PORT}/api          ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
