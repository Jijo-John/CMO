# SocialFlow - Content Operations Platform

A production-ready, multi-tenant SaaS platform for managing social media content workflows before posting.

## 🚀 Features

- **Multi-Tenant Architecture**: Support multiple businesses per user
- **Role-Based Access Control**: Owner, Admin, Creator, Reviewer, Viewer roles
- **Content Management**: Draft → Review → Approved → Posted workflow
- **Platform Support**: LinkedIn, Instagram, Facebook, X, YouTube, TikTok, and more
- **Media Library**: Upload, manage, and organize media assets
- **Content Calendar**: Visual planning with drag-and-drop
- **Manual Posting Assistant**: Platform-specific preparation tools

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend**: Node.js, Express
- **Database**: sql.js (SQLite in-memory/file-based)
- **Auth**: JWT-based authentication
- **Storage**: Local file system (S3-compatible structure)

## 📁 Project Structure

```
socialflow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── package.json
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd socialflow
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URL
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/api

## 📊 Database Schema

The application uses the following core tables:

- **businesses**: Multi-tenant business entities
- **users**: User accounts
- **business_users**: Business-user role mappings
- **platforms**: Social media platform definitions
- **content**: Content items
- **content_platforms**: Content-platform assignments
- **media**: Media assets
- **activity_logs**: Audit trail

## 🔐 Default Credentials

After first run, create an account via the signup page. The first user becomes the owner of any new business they create.

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Businesses
- `GET /api/businesses` - List user's businesses
- `POST /api/businesses` - Create business
- `GET /api/businesses/:id` - Get business details
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business

### Content
- `GET /api/content` - List content (filtered by business)
- `POST /api/content` - Create content
- `GET /api/content/:id` - Get content details
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content
- `PATCH /api/content/:id/status` - Update status

### Users
- `GET /api/businesses/:id/users` - List business users
- `POST /api/businesses/:id/users/invite` - Invite user
- `PUT /api/businesses/:id/users/:userId` - Update user role
- `DELETE /api/businesses/:id/users/:userId` - Remove user

### Media
- `POST /api/media/upload` - Upload media
- `GET /api/media` - List media
- `DELETE /api/media/:id` - Delete media

## 🎨 Design System

- **Colors**: Neutral slate/gray base with dynamic platform accents
- **Typography**: Inter/system sans-serif
- **Status Colors**: Green (success), Yellow (warning), Red (error)
- **Components**: Reusable buttons, inputs, cards, badges, modals

## 🔒 Security Features

- JWT authentication with refresh tokens
- Role-based access control per business
- Business isolation in all queries
- Input validation and sanitization
- CORS configuration
- File upload validation

## 📱 Responsive Design

- Mobile-first approach
- Sidebar converts to drawer on mobile
- Adaptive calendar views
- Stacked card layouts on small screens

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ for social media teams and agencies
