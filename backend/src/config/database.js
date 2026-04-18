const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;

const getDatabasePath = () => {
  const dbPath = process.env.DATABASE_PATH || './data/socialflow.db';
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dbPath;
};

const initDatabase = async () => {
  const SQL = await initSqlJs();
  const dbPath = getDatabasePath();
  
  // Load existing database or create new one
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('Database loaded from file');
    } else {
      db = new SQL.Database();
      console.log('New database created');
    }
  } catch (error) {
    console.error('Error loading database:', error);
    db = new SQL.Database();
  }

  // Create tables
  createTables();
  
  // Seed default platforms
  seedPlatforms();
  
  return db;
};

const createTables = () => {
  const tables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Businesses table
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    -- Business-User role mapping
    CREATE TABLE IF NOT EXISTS business_users (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'creator', 'reviewer', 'viewer')),
      invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      joined_at DATETIME,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(business_id, user_id)
    );

    -- Platforms table
    CREATE TABLE IF NOT EXISTS platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand_color TEXT NOT NULL,
      icon_placeholder TEXT,
      content_rules TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Content table
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT,
      hashtags TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'approved', 'posted', 'rejected')),
      scheduled_date DATETIME,
      posted_date DATETIME,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Content-Platform assignment table
    CREATE TABLE IF NOT EXISTS content_platforms (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      platform_caption TEXT,
      platform_hashtags TEXT,
      is_posted INTEGER DEFAULT 0,
      posted_at DATETIME,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
      FOREIGN KEY (platform_id) REFERENCES platforms(id),
      UNIQUE(content_id, platform_id)
    );

    -- Media table
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    -- Content-Media association table
    CREATE TABLE IF NOT EXISTS content_media (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      media_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
    );

    -- Activity logs table
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Invite tokens table
    CREATE TABLE IF NOT EXISTS invite_tokens (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);
    CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
    CREATE INDEX IF NOT EXISTS idx_content_business ON content(business_id);
    CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
    CREATE INDEX IF NOT EXISTS idx_content_platforms_content ON content_platforms(content_id);
    CREATE INDEX IF NOT EXISTS idx_media_business ON media(business_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_business ON activity_logs(business_id);
    CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
  `;

  db.run(tables);
  console.log('Database tables created successfully');
};

const seedPlatforms = () => {
  // Check if platforms already exist
  const result = db.exec('SELECT COUNT(*) as count FROM platforms');
  if (result.length > 0 && result[0].values[0][0] > 0) {
    console.log('Platforms already seeded');
    return;
  }

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', brand_color: '#0A66C2', icon: 'in', rules: '{"maxChars": 3000, "maxHashtags": 30, "imageAspectRatios": ["1.91:1", "1:1", "4:5"]}' },
    { id: 'instagram', name: 'Instagram', brand_color: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', icon: 'ig', rules: '{"maxChars": 2200, "maxHashtags": 30, "imageAspectRatios": ["1:1", "4:5", "1.91:1"]}' },
    { id: 'facebook', name: 'Facebook', brand_color: '#1877F2', icon: 'fb', rules: '{"maxChars": 63206, "maxHashtags": "unlimited", "imageAspectRatios": ["1.91:1", "1:1", "4:5"]}' },
    { id: 'twitter', name: 'X / Twitter', brand_color: '#000000', icon: 'x', rules: '{"maxChars": 280, "maxHashtags": "unlimited", "imageAspectRatios": ["16:9", "1:1"]}' },
    { id: 'youtube', name: 'YouTube', brand_color: '#FF0000', icon: 'yt', rules: '{"maxChars": 5000, "maxHashtags": 15, "imageAspectRatios": ["16:9"]}' },
    { id: 'pinterest', name: 'Pinterest', brand_color: '#E60023', icon: 'pi', rules: '{"maxChars": 500, "maxHashtags": 20, "imageAspectRatios": ["2:3", "1:1"]}' },
    { id: 'google-business', name: 'Google Business Profile', brand_color: '#4285F4', icon: 'gb', rules: '{"maxChars": 1500, "maxHashtags": 0, "imageAspectRatios": ["4:3"]}' },
    { id: 'tiktok', name: 'TikTok', brand_color: '#000000', icon: 'tt', rules: '{"maxChars": 2200, "maxHashtags": "unlimited", "videoOnly": true}' },
    { id: 'snapchat', name: 'Snapchat', brand_color: '#FFFC00', icon: 'sc', rules: '{"maxChars": 80, "videoOnly": true}' },
    { id: 'reddit', name: 'Reddit', brand_color: '#FF4500', icon: 'rd', rules: '{"maxChars": 40000, "maxHashtags": 0}' },
    { id: 'threads', name: 'Threads', brand_color: '#000000', icon: 'th', rules: '{"maxChars": 500, "maxHashtags": "unlimited"}' }
  ];

  const stmt = db.prepare(`
    INSERT INTO platforms (id, name, brand_color, icon_placeholder, content_rules, is_active)
    VALUES (:id, :name, :brand_color, :icon, :rules, 1)
  `);

  platforms.forEach(platform => {
    stmt.run({
      ':id': platform.id,
      ':name': platform.name,
      ':brand_color': platform.brand_color,
      ':icon': platform.icon,
      ':rules': platform.rules
    });
  });

  stmt.free();
  console.log('Default platforms seeded successfully');
};

const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(getDatabasePath(), buffer);
  }
};

const getDb = () => {
  return db;
};

module.exports = {
  initDatabase,
  getDb,
  saveDatabase
};
