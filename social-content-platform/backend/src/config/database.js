const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;

const DB_FILE = process.env.DB_FILE || './data/database.sqlite';

// Initialize database with schema
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
    console.log('✅ Database loaded from file');
  } else {
    db = new SQL.Database();
    console.log('✅ New database created');
  }

  // Create tables
  runSchema(db);
  
  // Seed platforms
  seedPlatforms(db);
  
  saveDatabase();
  return db;
}

// Run SQL schema
function runSchema(database) {
  const schema = `
    -- Businesses table
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Business-User relationship with roles
    CREATE TABLE IF NOT EXISTS business_users (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'creator', 'reviewer', 'viewer')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(business_id, user_id)
    );

    -- Social media platforms
    CREATE TABLE IF NOT EXISTS platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      brand_color TEXT NOT NULL,
      icon_placeholder TEXT,
      content_rules TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Content items
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT,
      hashtags TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'approved', 'posted')),
      scheduled_date DATETIME,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Content-Platform many-to-many relationship
    CREATE TABLE IF NOT EXISTS content_platforms (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      platform_caption TEXT,
      FOREIGN KEY (content_id) REFERENCES content(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id),
      UNIQUE(content_id, platform_id)
    );

    -- Media files
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_id) REFERENCES content(id)
    );

    -- Activity logs for audit trail
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_content_business ON content(business_id);
    CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
    CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_business_users ON business_users(business_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_media_content ON media(content_id);
    CREATE INDEX IF NOT EXISTS idx_activity_business ON activity_logs(business_id);
  `;

  database.run(schema);
  console.log('✅ Schema initialized');
}

// Seed predefined platforms
function seedPlatforms(database) {
  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', brand_color: '#0A66C2', icon: 'in', rules: '{"maxChars":3000,"hashtagLimit":30,"supportsVideo":true}' },
    { id: 'instagram', name: 'Instagram', brand_color: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', icon: 'ig', rules: '{"maxChars":2200,"hashtagLimit":30,"supportsVideo":true}' },
    { id: 'facebook', name: 'Facebook', brand_color: '#1877F2', icon: 'fb', rules: '{"maxChars":63206,"hashtagLimit":30,"supportsVideo":true}' },
    { id: 'twitter', name: 'X / Twitter', brand_color: '#000000', icon: 'x', rules: '{"maxChars":280,"hashtagLimit":10,"supportsVideo":true}' },
    { id: 'youtube', name: 'YouTube', brand_color: '#FF0000', icon: 'yt', rules: '{"maxChars":5000,"hashtagLimit":15,"supportsVideo":true}' },
    { id: 'pinterest', name: 'Pinterest', brand_color: '#E60023', icon: 'pi', rules: '{"maxChars":500,"hashtagLimit":20,"supportsVideo":true}' },
    { id: 'google-business', name: 'Google Business Profile', brand_color: '#4285F4', icon: 'gb', rules: '{"maxChars":1500,"hashtagLimit":5,"supportsVideo":true}' },
    { id: 'tiktok', name: 'TikTok', brand_color: '#000000', icon: 'tt', rules: '{"maxChars":2200,"hashtagLimit":30,"supportsVideo":true}' },
    { id: 'snapchat', name: 'Snapchat', brand_color: '#FFFC00', icon: 'sc', rules: '{"maxChars":200,"hashtagLimit":10,"supportsVideo":true}' },
    { id: 'reddit', name: 'Reddit', brand_color: '#FF4500', icon: 'rd', rules: '{"maxChars":40000,"hashtagLimit":0,"supportsVideo":true}' },
    { id: 'threads', name: 'Threads', brand_color: '#000000', icon: 'th', rules: '{"maxChars":500,"hashtagLimit":10,"supportsVideo":true}' }
  ];

  const stmt = database.prepare('INSERT OR IGNORE INTO platforms (id, name, brand_color, icon_placeholder, content_rules) VALUES (?, ?, ?, ?, ?)');
  
  platforms.forEach(p => {
    stmt.run([p.id, p.name, p.brand_color, p.icon, p.rules]);
  });
  
  stmt.free();
  console.log('✅ Platforms seeded');
}

// Save database to file
function saveDatabase() {
  if (!db) return;
  
  const data = db.export();
  const buffer = Buffer.from(data);
  
  // Ensure directory exists
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(DB_FILE, buffer);
}

// Get database instance
function getDatabase() {
  return db;
}

// Execute query and return results
function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

// Execute mutation (INSERT, UPDATE, DELETE)
function mutate(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  
  db.run(sql, params);
  saveDatabase();
  
  return { success: true };
}

module.exports = {
  initDatabase,
  getDatabase,
  query,
  mutate,
  saveDatabase
};
