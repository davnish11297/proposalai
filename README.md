# ProposalAI - Next.js Version

A comprehensive proposal management system with AI-powered content generation, client management, and collaboration features built with Next.js 14.

## Features

- 🤖 **AI-Powered Proposal Generation** - Generate professional proposals using OpenRouter API
- 📧 **Email Integration** - Send proposals directly to clients via SendGrid
- 👥 **Client Management** - Organize and track client relationships
- 📊 **Analytics & Tracking** - Monitor proposal engagement and effectiveness
- 💬 **Real-time Comments** - Collaborate with team members on proposals
- 🔐 **Secure Access Control** - JWT-based authentication and authorization
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **AI**: OpenRouter API (Claude Sonnet 4 recommended)
- **Email**: SendGrid
- **Authentication**: JWT with custom implementation
- **File Processing**: PDF generation with Puppeteer (memory-only)

## Prerequisites

- Node.js 18+ 
- MongoDB database (MongoDB Atlas recommended)
- OpenRouter API key (or other AI provider)
- SendGrid API key (optional, for email features)

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd proposalai-nextjs
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
```env
# Database - Uses NEW database names (isolated from existing data)
MONGODB_URI_DEV=mongodb+srv://username:password@cluster0.mongodb.net/proposalai_nextjs_dev
MONGODB_URI_PROD=mongodb+srv://username:password@cluster0.mongodb.net/proposalai_nextjs_prod

# Environment Detection
NODE_ENV=development

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-in-production
JWT_SECRET=your-super-secret-jwt-key-here

# AI Provider (OpenRouter recommended)
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key-here
EMAIL_FROM=your-email@domain.com

# Session
SESSION_SECRET=your-session-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DISABLE_RATE_LIMITING_IN_DEV=true
```

### 4. Start the development server
```bash
npm run dev
```

### 5. Open your browser
Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

This Next.js version uses **NEW database names** to ensure complete isolation from any existing ProposalAI data:

- **Development**: `proposalai_nextjs_dev`
- **Production**: `proposalai_nextjs_prod`

The database will be automatically created when you first run the application. No manual setup is required.

## API Routes

The application includes these API endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Proposals (To be implemented)
- `GET /api/proposals` - List proposals
- `POST /api/proposals` - Create proposal
- `GET /api/proposals/[id]` - Get proposal
- `PUT /api/proposals/[id]` - Update proposal
- `DELETE /api/proposals/[id]` - Delete proposal
- `POST /api/proposals/generate` - AI-generate proposal

### Additional Routes (To be implemented)
- `/api/clients` - Client management
- `/api/comments` - Comments system
- `/api/email` - Email services
- `/api/pdf` - PDF generation

## Project Structure

```
proposalai-nextjs/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── proposals/
│   │   └── ...
│   ├── dashboard/
│   ├── proposals/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Shared components
│   ├── providers/               # Context providers
│   └── ui/                      # UI components
├── lib/                         # Utilities
│   ├── mongodb.ts              # Database connection
│   ├── auth.ts                 # Authentication utilities
│   └── utils.ts                # General utilities
├── models/                      # Mongoose schemas
│   ├── User.ts
│   ├── Organization.ts
│   ├── Proposal.ts
│   └── ...
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Support

This application is designed to work in both:

### Local Development
- Run `npm run dev` for development server
- Uses development database (`proposalai_nextjs_dev`)
- Hot reloading and development features enabled

### Vercel Production
- Automatic deployment to Vercel
- Uses production database (`proposalai_nextjs_prod`)
- Optimized builds and serverless functions

## Key Features Implementation Status

### ✅ Completed
- [x] Project setup and configuration
- [x] Database connection with Mongoose
- [x] User authentication (register/login)
- [x] JWT-based auth system
- [x] Responsive UI with Tailwind CSS
- [x] Environment-based configuration
- [x] MongoDB models for all entities

### 🚧 In Progress
- [ ] Dashboard implementation
- [ ] Proposal CRUD operations
- [ ] AI integration for proposal generation
- [ ] Client management system
- [ ] Comments and collaboration features

### 📋 To Do
- [ ] Email integration with SendGrid
- [ ] PDF generation and export
- [ ] Analytics and tracking
- [ ] File upload handling
- [ ] Advanced proposal templates
- [ ] Team management
- [ ] Public proposal sharing

## Migration from Original ProposalAI

This Next.js version maintains:
- **Exact same functionality** as the original React + Express version
- **Identical UI/UX** with same components and styling
- **Same API structure** converted to Next.js API routes
- **Same database schema** using Mongoose instead of Prisma
- **Complete feature parity** with additional performance optimizations

### Key Differences
- Unified Next.js application instead of separate frontend/backend
- Mongoose ODM instead of Prisma ORM
- Next.js API Routes instead of Express routes
- App Router instead of React Router
- NEW database names for complete isolation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support, please check:
1. This README for setup instructions
2. Next.js documentation for framework-specific questions
3. Create an issue for bugs or feature requests

## License

MIT License - see LICENSE file for details.