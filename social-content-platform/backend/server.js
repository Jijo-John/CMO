const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    console.log('💤 HTTP server closed.');
    await pool.end();
    console.log('💤 Database connections closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    console.log('💤 HTTP server closed.');
    await pool.end();
    console.log('💤 Database connections closed.');
    process.exit(0);
  });
});

module.exports = server;
