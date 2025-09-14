# SaaS Notes Application

A comprehensive multi-tenant SaaS Notes Application built with Next.js, featuring JWT authentication, role-based access control, and subscription management.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure token management
- Multi-tenant architecture with strict data isolation
- Role-based access control (Admin/Member roles)
- User registration and login with organization setup

### 📝 Notes Management
- Full CRUD operations for notes
- Search functionality across titles, content, and tags
- Tag-based organization and filtering
- Private notes (Pro feature)
- Bulk operations support

### 💳 Subscription Management
- Free and Pro subscription tiers
- Feature gating based on subscription level
- Usage tracking and limits enforcement
- Subscription upgrade/downgrade functionality

### 🏢 Multi-Tenancy
- Complete tenant isolation at the database level
- Organization-based user management
- Admin-only team invitation system
- Tenant-specific usage analytics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user and organization
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/invite` - Invite team members (Admin only)

### Notes Management
- `GET /api/notes` - List notes with pagination and search
- `POST /api/notes` - Create new note
- `GET /api/notes/[id]` - Get specific note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note
- `DELETE /api/notes/bulk` - Bulk delete notes

### Subscription Management
- `GET /api/subscription` - Get subscription info and usage
- `POST /api/subscription` - Upgrade/downgrade subscription
- `GET /api/subscription/usage` - Detailed usage statistics

## Subscription Tiers

### Free Plan
- Up to 50 notes
- No private notes
- Up to 3 tags per note
- No team invites
- 30 API requests/minute

### Pro Plan ($9/month)
- Unlimited notes
- Unlimited private notes
- Up to 10 tags per note
- Team invitations
- 300 API requests/minute

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Authentication**: JWT with bcryptjs
- **Database**: Local JSON file storage (easily replaceable with SQL/NoSQL)
- **Deployment**: Vercel-optimized with CORS support

## Getting Started

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd saas-notes-app
   npm install
   \`\`\`

2. **Environment Variables**
   Create a `.env.local` file:
   \`\`\`
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   \`\`\`

3. **Development**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Production Deployment**
   - Deploy to Vercel with one click
   - CORS is pre-configured for API access
   - Environment variables are managed through Vercel dashboard

## Security Features

- Password hashing with bcryptjs
- JWT token expiration (7 days)
- Tenant isolation at all data access points
- Role-based API endpoint protection
- Input validation and sanitization
- CORS configuration for secure API access

## Architecture Highlights

- **Multi-tenant by design**: Every data operation includes tenant isolation
- **Subscription-aware**: Feature gating implemented throughout the application
- **Scalable API design**: RESTful endpoints with proper HTTP status codes
- **Modern React patterns**: Context API for state management, custom hooks
- **Type-safe**: Full TypeScript implementation with proper interfaces

## Usage Examples

### Register New Organization
\`\`\`javascript
POST /api/auth/register
{
  "email": "admin@company.com",
  "password": "securepassword",
  "tenantName": "My Company"
}
\`\`\`

### Create Note
\`\`\`javascript
POST /api/notes
Authorization: Bearer <jwt-token>
{
  "title": "Meeting Notes",
  "content": "Important discussion points...",
  "tags": ["work", "meeting"],
  "isPrivate": true
}
\`\`\`

### Search Notes
\`\`\`javascript
GET /api/notes?search=meeting&tags=work&page=1&limit=10
Authorization: Bearer <jwt-token>
\`\`\`

This application demonstrates enterprise-grade SaaS architecture with proper multi-tenancy, authentication, and subscription management suitable for production deployment.
