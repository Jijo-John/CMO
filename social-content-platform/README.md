# Social Content Manager - Production SaaS Platform

A multi-tenant SaaS platform for managing social media content workflow before manual posting.

## 🏗️ Architecture Overview

```
social-content-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # sql.js initialization
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication
│   │   │   ├── roleCheck.js         # Role-based access control
│   │   │   └── businessScope.js     # Multi-tenant isolation
│   │   ├── routes/
│   │   │   ├── auth.js              # Login/Register
│   │   │   ├── businesses.js        # Business CRUD
│   │   │   ├── platforms.js         # Social platforms
│   │   │   ├── content.js           # Content management
│   │   │   ├── media.js             # Media upload/download
│   │   │   └── calendar.js          # Calendar views
│   │   ├── services/
│   │   │   ├── authService.js       # Auth logic
│   │   │   ├── businessService.js   # Business logic
│   │   │   ├── contentService.js    # Content workflow
│   │   │   └── mediaService.js      # File handling
│   │   ├── utils/
│   │   │   ├── jwt.js               # JWT helpers
│   │   │   ├── password.js          # Password hashing
│   │   │   └── validation.js        # Input validation
│   │   └── app.js                   # Express app setup
│   ├── uploads/                     # Local file storage
│   ├── data/                        # SQLite database file
│   ├── .env
│   ├── package.json
│   └── server.js                    # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   │   │   ├── page.tsx         # Main dashboard
│   │   │   │   ├── content/
│   │   │   │   ├── calendar/
│   │   │   │   ├── media/
│   │   │   │   ├── team/
│   │   │   │   └── settings/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── types/
│   │   └── utils/
│   ├── .env.local
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
└── README.md
```

## 🗄️ Database Schema (SQLite via sql.js)

### Tables

1. **businesses** - Multi-tenant business entities
2. **users** - User accounts
3. **business_users** - User-business relationships with roles
4. **platforms** - Predefined social media platforms (11 platforms seeded)
5. **content** - Content items with workflow status
6. **content_platforms** - Many-to-many: content ↔ platforms
7. **media** - Media files attached to content
8. **activity_logs** - Audit trail

## 🔑 Key Features

- ✅ Multi-tenant architecture (business isolation)
- ✅ Role-based access control (Owner, Admin, Creator, Reviewer, Viewer)
- ✅ Content workflow (Draft → Review → Approved → Posted)
- ✅ Manual posting assistant (copy caption, download media)
- ✅ Content calendar with drag-and-drop scheduling
- ✅ Media library with filters
- ✅ 11 predefined social platforms with brand colors and rules
- ✅ Fully self-hostable with sql.js (no PostgreSQL required)

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📦 Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript, Zustand
- **Backend**: Node.js, Express, sql.js
- **Storage**: Local filesystem (uploads/)
- **Auth**: JWT tokens
- **Database**: SQLite (file-backed via sql.js)

## 🔐 Default Workflow

1. Register new account at `/register`
2. First business is created automatically
3. Create content with title, caption, hashtags
4. Upload media files
5. Assign to platforms (LinkedIn, Instagram, Facebook, X, YouTube, etc.)
6. Submit for review
7. Reviewer approves
8. Use Post Ready View to copy caption and download media
9. Manually post to each platform
10. Mark as posted

## 📝 API Endpoints

### Auth
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Businesses
- GET `/api/businesses` - List user's businesses
- POST `/api/businesses` - Create business
- GET `/api/businesses/:id` - Get business
- PUT `/api/businesses/:id` - Update business
- DELETE `/api/businesses/:id` - Delete business
- GET `/api/businesses/:id/team` - Get team members
- POST `/api/businesses/:id/team/invite` - Invite user

### Platforms
- GET `/api/platforms` - List all platforms

### Content
- GET `/api/businesses/:id/content` - List content
- POST `/api/businesses/:id/content` - Create content
- GET `/api/content/:id` - Get content details
- PUT `/api/content/:id` - Update content
- PATCH `/api/content/:id/status` - Update status (workflow)
- DELETE `/api/content/:id` - Delete content

### Media
- POST `/api/businesses/:id/media/upload` - Upload file
- GET `/api/businesses/:id/media` - List media
- GET `/api/media/:id/download` - Download file
- DELETE `/api/media/:id` - Delete file

### Calendar
- GET `/api/businesses/:id/calendar` - Get calendar events
- PUT `/api/content/:id/schedule` - Schedule content

## 🎨 UI Pages

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard with stats
- `/dashboard/content` - Content library
- `/dashboard/content/new` - Create content
- `/dashboard/content/:id` - Content detail + Post Ready View
- `/dashboard/calendar` - Content calendar
- `/dashboard/media` - Media library
- `/dashboard/team` - Team management
- `/dashboard/settings` - Business settings

## 🔄 Content Workflow

```
Draft → Review → Approved → Posted
  ↑       ↑         ↑
  └───────┴─────────┘
```

- **Creator**: Can create, edit, submit for review
- **Reviewer**: Can approve/reject content
- **Admin/Owner**: Full control

## 📄 License

MIT
