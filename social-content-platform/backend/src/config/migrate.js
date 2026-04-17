const { pool } = require('./database');

/**
 * Database Migration Script
 * Creates all required tables and initial data
 */
async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');
    
    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✅ UUID extension enabled');
    
    // Create businesses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(500),
        owner_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ businesses table created');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ users table created');
    
    // Create user_role enum and business_users table
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('owner', 'admin', 'creator', 'reviewer', 'viewer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role user_role NOT NULL,
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        joined_at TIMESTAMP WITH TIME ZONE,
        invited_by UUID REFERENCES users(id),
        UNIQUE(business_id, user_id)
      )
    `);
    console.log('✅ business_users table created');
    
    // Create platforms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        brand_color VARCHAR(7) NOT NULL,
        icon_placeholder VARCHAR(50),
        content_rules JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ platforms table created');
    
    // Insert default platforms
    await client.query(`
      INSERT INTO platforms (name, brand_color, icon_placeholder, content_rules)
      VALUES
        ('LinkedIn', '#0A66C2', 'in', '{"max_chars": 3000, "hashtag_limit": 30, "supports_video": true, "supports_image": true}'),
        ('Instagram', 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', 'ig', '{"max_chars": 2200, "hashtag_limit": 30, "supports_video": true, "supports_image": true}'),
        ('Facebook', '#1877F2', 'fb', '{"max_chars": 63206, "hashtag_limit": null, "supports_video": true, "supports_image": true}'),
        ('X', '#000000', 'x', '{"max_chars": 280, "hashtag_limit": null, "supports_video": true, "supports_image": true}'),
        ('YouTube', '#FF0000', 'yt', '{"max_chars": 5000, "hashtag_limit": 15, "supports_video": true, "supports_image": true}'),
        ('Pinterest', '#E60023', 'pi', '{"max_chars": 500, "hashtag_limit": 20, "supports_video": true, "supports_image": true}'),
        ('Google Business Profile', '#4285F4', 'gbp', '{"max_chars": 1500, "hashtag_limit": null, "supports_video": true, "supports_image": true}'),
        ('TikTok', '#000000', 'tt', '{"max_chars": 2200, "hashtag_limit": null, "supports_video": true, "supports_image": false}'),
        ('Snapchat', '#FFFC00', 'sc', '{"max_chars": 200, "hashtag_limit": null, "supports_video": true, "supports_image": true}'),
        ('Reddit', '#FF4500', 'rd', '{"max_chars": 10000, "hashtag_limit": null, "supports_video": true, "supports_image": true}'),
        ('Threads', '#000000', 'th', '{"max_chars": 500, "hashtag_limit": null, "supports_video": true, "supports_image": true}')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Default platforms inserted');
    
    // Create content_status enum and content table
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE content_status AS ENUM ('draft', 'review', 'approved', 'posted', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        caption TEXT,
        hashtags TEXT[],
        scheduled_date TIMESTAMP WITH TIME ZONE,
        status content_status DEFAULT 'draft',
        created_by UUID NOT NULL REFERENCES users(id),
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        posted_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ content table created');
    
    // Create content_platforms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_platforms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
        caption_override TEXT,
        hashtags_override TEXT[],
        is_posted BOOLEAN DEFAULT false,
        posted_at TIMESTAMP WITH TIME ZONE,
        platform_specific_data JSONB DEFAULT '{}',
        UNIQUE(content_id, platform_id)
      )
    `);
    console.log('✅ content_platforms table created');
    
    // Create media_type enum and media table
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE media_type AS ENUM ('image', 'video');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_type media_type NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        width INTEGER,
        height INTEGER,
        duration INTEGER,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ media table created');
    
    // Create content_media table
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_media (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        UNIQUE(content_id, media_id)
      )
    `);
    console.log('✅ content_media table created');
    
    // Create activity_type enum and activity_logs table
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE activity_type AS ENUM (
          'content_created', 'content_updated', 'content_submitted_review',
          'content_approved', 'content_rejected', 'content_posted',
          'media_uploaded', 'media_deleted', 'user_invited',
          'user_joined', 'user_removed'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        activity_type activity_type NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ activity_logs table created');
    
    // Create invitations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        invited_by UUID NOT NULL REFERENCES users(id),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        accepted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ invitations table created');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users(business_id);
      CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_content_business_id ON content(business_id);
      CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
      CREATE INDEX IF NOT EXISTS idx_content_scheduled_date ON content(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_media_business_id ON media(business_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON activity_logs(business_id);
    `);
    console.log('✅ Indexes created');
    
    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Add triggers
    await client.query(`
      DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
      CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_content_updated_at ON content;
      CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Triggers created');
    
    console.log('\n🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrate };
