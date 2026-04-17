const bcrypt = require('bcryptjs');
const { pool } = require('./database');

/**
 * Seed Database with Initial Data
 * Creates default admin user for development
 */
async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if admin user already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️  Admin user already exists, skipping...');
    } else {
      // Create default admin user
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      
      await client.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3)`,
        ['admin@example.com', passwordHash, 'Admin User']
      );
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@example.com');
      console.log('   Password: Admin123!');
    }
    
    console.log('\n🎉 Database seeding completed!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed };
