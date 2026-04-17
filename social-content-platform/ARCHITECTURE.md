# Social Content Platform - Production SaaS Architecture

## 📐 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Pages     │  │ Components   │  │   State Management   │   │
│  │  (App Router)│  │  (Reusable)  │  │   (React Context)    │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Routes    │  │ Controllers  │  │     Middleware       │   │
│  │   (REST)    │  │   (Logic)    │  │ (Auth, RBAC, Tenant) │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Models (sql.js ORM)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (sql.js - SQLite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │Businesses│  │  Users   │  │ Content  │  │    Media     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │Platforms │  │  Roles   │  │ Activity │  │ BusinessUsers│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FILE STORAGE (Local/S3)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              /uploads/{images,videos}                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ MULTI-TENANT DESIGN

### Tenant Isolation Strategy
- Every query includes `business_id` filter
- JWT token contains `businessId` claim
- Middleware enforces business context
- Row-level security through application logic

### Business Context Flow
1. User logs in → receives JWT with all businesses
2. User selects business → frontend stores `selectedBusinessId`
3. All API calls include `X-Business-ID` header
4. Backend middleware validates business access
5. Database queries scoped to `business_id`

## 🔐 SECURITY MODEL

### Authentication
- JWT-based authentication
- Token expiration: 24 hours
- Refresh token support
- Password hashing (bcrypt)

### Authorization (RBAC)
- Role-based access control per business
- Permissions matrix:
  ```
  Owner   → All permissions
  Admin   → Manage users + content
  Creator → Create/edit content
  Reviewer→ Approve/reject content
  Viewer  → Read-only access
  ```

### Data Isolation
- Business-scoped queries
- Middleware validation
- SQL injection prevention (parameterized queries)

## 📊 SCALABILITY CONSIDERATIONS

### Horizontal Scaling
- Stateless backend (sessionless JWT)
- Shared database (SQLite for MVP, PostgreSQL ready)
- CDN for media assets

### Performance Optimizations
- Database indexing on `business_id`, `status`, `created_at`
- Pagination for large datasets
- Lazy loading for media
- Caching layer ready (Redis compatible)

## 🔄 WORKFLOW ENGINE

### Content Lifecycle
```
Draft → [Submit] → Review → [Approve/Reject] → Approved → [Post] → Posted
                ↓                          ↓
            [Edit]                     [Edit]
```

### Status Transitions
- Draft: Initial state, editable by creators
- Review: Pending approval, locked for editing
- Approved: Ready for posting, locked
- Posted: Published, read-only

## 🎯 KEY DESIGN DECISIONS

1. **sql.js over full SQLite**: In-memory database for development, file-based for production
2. **Local storage first**: S3-compatible interface for easy migration
3. **No social APIs**: Manual posting workflow by design
4. **Multi-business from day one**: Core architectural principle
5. **Role-based UI**: Frontend respects backend permissions

## 📁 FOLDER STRUCTURE OVERVIEW

```
social-content-platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment & constants
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, RBAC, validation
│   │   ├── models/         # Database models & queries
│   │   ├── routes/         # API endpoints
│   │   └── utils/          # Helpers & utilities
│   ├── uploads/            # Media storage
│   └── server.js           # Entry point
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages (App Router)
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API clients & utilities
│   │   └── styles/         # Global styles
│   └── public/             # Static assets
└── README.md
```

## 🚀 DEPLOYMENT STRATEGY

### Development
- Hot reload for frontend/backend
- In-memory database
- Local file storage

### Production
- Process manager (PM2) for backend
- Static export or Vercel for frontend
- Persistent SQLite database
- S3 or local storage with backups

### Environment Variables
```bash
# Backend
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_PATH=./data/database.sqlite
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAX_UPLOAD_SIZE=10485760
```

This architecture supports:
✅ Multi-tenant isolation
✅ Role-based access control
✅ Scalable content workflows
✅ Production-ready security
✅ Easy deployment & maintenance
