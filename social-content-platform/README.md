# Social Content Platform - Production-Ready SaaS

## 📋 System Architecture Overview

This is a **multi-tenant SaaS platform** for managing social media content workflows before manual posting.

### Architecture Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Pages     │ │ Components  │ │   State Management  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Express.js)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Routes    │ │ Controllers │ │    Middleware       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Models    │ │  Services   │ │     Utils           │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ PostgreSQL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Businesses  │ │   Users     │ │    Content          │   │
│  │ Platforms   │ │   Media     │ │ Activity Logs       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Local/S3 Storage
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  File Storage                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Images / Videos                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Features
- **Multi-tenant**: Each business has isolated data
- **Role-based Access Control**: Owner, Admin, Creator, Reviewer, Viewer
- **Content Workflow**: Draft → Review → Approved → Posted
- **Manual Posting Assistant**: Copy caption, download media, mark as posted
- **Calendar View**: Plan and schedule content
- **Media Library**: Organize all assets

---

## 📁 Folder Structure

```
social-content-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── index.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── business.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── content.controller.js
│   │   │   ├── media.controller.js
│   │   │   └── platform.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── business.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── models/
│   │   │   ├── Business.js
│   │   │   ├── User.js
│   │   │   ├── BusinessUser.js
│   │   │   ├── Platform.js
│   │   │   ├── Content.js
│   │   │   ├── ContentPlatform.js
│   │   │   ├── Media.js
│   │   │   └── ActivityLog.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── business.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── content.routes.js
│   │   │   ├── media.routes.js
│   │   │   └── platform.routes.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── business.service.js
│   │   │   ├── content.service.js
│   │   │   ├── media.service.js
│   │   │   └── ai.service.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   └── app.js
│   ├── uploads/
│   ├── logs/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── content/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx
│   │   │   ├── media-library/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── BusinessSelector.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Badge.tsx
│   │   │   ├── content/
│   │   │   │   ├── ContentCard.tsx
│   │   │   │   ├── ContentForm.tsx
│   │   │   │   ├── PostReadyView.tsx
│   │   │   │   └── StatusBadge.tsx
│   │   │   └── business/
│   │   │       ├── BusinessCard.tsx
│   │   │       └── InviteUserModal.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useBusiness.ts
│   │   │   └── useContent.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── BusinessContext.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── globals.css
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.js
│
└── README.md
```

---

## 🗄️ Database Schema (PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BUSINESSES TABLE
-- ============================================
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- BUSINESS_USERS TABLE (Many-to-Many with Roles)
-- ============================================
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'creator', 'reviewer', 'viewer');

CREATE TABLE business_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES users(id),
    UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_user_id ON business_users(user_id);

-- ============================================
-- PLATFORMS TABLE (Predefined Social Platforms)
-- ============================================
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    brand_color VARCHAR(7) NOT NULL,
    icon_placeholder VARCHAR(50),
    content_rules JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default platforms
INSERT INTO platforms (name, brand_color, icon_placeholder, content_rules) VALUES
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
('Threads', '#000000', 'th', '{"max_chars": 500, "hashtag_limit": null, "supports_video": true, "supports_image": true}');

-- ============================================
-- CONTENT TABLE
-- ============================================
CREATE TYPE content_status AS ENUM ('draft', 'review', 'approved', 'posted', 'rejected');

CREATE TABLE content (
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
);

CREATE INDEX idx_content_business_id ON content(business_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_scheduled_date ON content(scheduled_date);
CREATE INDEX idx_content_created_by ON content(created_by);

-- ============================================
-- CONTENT_PLATFORMS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE content_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    caption_override TEXT,
    hashtags_override TEXT[],
    is_posted BOOLEAN DEFAULT false,
    posted_at TIMESTAMP WITH TIME ZONE,
    platform_specific_data JSONB DEFAULT '{}',
    UNIQUE(content_id, platform_id)
);

CREATE INDEX idx_content_platforms_content_id ON content_platforms(content_id);
CREATE INDEX idx_content_platforms_platform_id ON content_platforms(platform_id);

-- ============================================
-- MEDIA TABLE
-- ============================================
CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TABLE media (
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
);

CREATE INDEX idx_media_business_id ON media(business_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_file_type ON media(file_type);

-- ============================================
-- CONTENT_MEDIA TABLE (Many-to-Many)
-- ============================================
CREATE TABLE content_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    UNIQUE(content_id, media_id)
);

CREATE INDEX idx_content_media_content_id ON content_media(content_id);
CREATE INDEX idx_content_media_media_id ON content_media(media_id);

-- ============================================
-- ACTIVITY_LOGS TABLE
-- ============================================
CREATE TYPE activity_type AS ENUM (
    'content_created',
    'content_updated',
    'content_submitted_review',
    'content_approved',
    'content_rejected',
    'content_posted',
    'media_uploaded',
    'media_deleted',
    'user_invited',
    'user_joined',
    'user_removed'
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    activity_type activity_type NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_business_id ON activity_logs(business_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- ============================================
-- INVITATIONS TABLE (For pending user invites)
-- ============================================
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔧 Setup & Run Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# DATABASE_URL=postgresql://user:password@localhost:5432/social_content_db
# JWT_SECRET=your-secret-key
# PORT=5000
# STORAGE_PATH=./uploads

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Or start production server
npm start
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

---

## 🔐 Default Credentials (Development Only)

After running migrations, a default admin user is created:
- Email: admin@example.com
- Password: Admin123!

**Change this immediately in production!**

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Businesses
- `GET /api/businesses` - List user's businesses
- `POST /api/businesses` - Create business
- `GET /api/businesses/:id` - Get business details
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business

### Users
- `GET /api/businesses/:businessId/users` - List business users
- `POST /api/businesses/:businessId/users/invite` - Invite user
- `PUT /api/businesses/:businessId/users/:userId/role` - Update role
- `DELETE /api/businesses/:businessId/users/:userId` - Remove user

### Content
- `GET /api/businesses/:businessId/content` - List content
- `POST /api/businesses/:businessId/content` - Create content
- `GET /api/businesses/:businessId/content/:id` - Get content
- `PUT /api/businesses/:businessId/content/:id` - Update content
- `DELETE /api/businesses/:businessId/content/:id` - Delete content
- `POST /api/businesses/:businessId/content/:id/submit-review` - Submit for review
- `POST /api/businesses/:businessId/content/:id/approve` - Approve content
- `POST /api/businesses/:businessId/content/:id/reject` - Reject content
- `POST /api/businesses/:businessId/content/:id/mark-posted` - Mark as posted

### Media
- `GET /api/businesses/:businessId/media` - List media
- `POST /api/businesses/:businessId/media/upload` - Upload media
- `GET /api/businesses/:businessId/media/:id` - Get media
- `DELETE /api/businesses/:businessId/media/:id` - Delete media
- `GET /api/media/:id/download` - Download media

### Platforms
- `GET /api/platforms` - List all platforms

---

## 🎨 UI/UX Design Principles

1. **Clean & Minimal**: Focus on content, reduce visual noise
2. **Card-Based Layout**: Easy to scan and understand
3. **Responsive**: Mobile-first design
4. **Platform Colors**: Visual indicators for each platform
5. **Smooth Transitions**: Polished user experience
6. **Clear Status Indicators**: Know content state at a glance

---

## 🚀 Production Deployment

### Environment Variables (Production)

```env
# Backend
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=strong-random-secret
PORT=5000
STORAGE_TYPE=s3
AWS_BUCKET=your-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
CORS_ORIGIN=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Scaling Considerations

1. **Database**: Use connection pooling (PgBouncer)
2. **File Storage**: Use S3 or compatible object storage
3. **Caching**: Implement Redis for sessions and frequently accessed data
4. **Load Balancing**: Use nginx or cloud load balancer
5. **Monitoring**: Implement logging and error tracking

---

## 📝 License

MIT License - See LICENSE file for details
