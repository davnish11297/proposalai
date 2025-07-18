# ProposalAI - Smart Client Proposal & RFP Response Generator

> AI-powered proposal generation platform for B2B teams

ProposalAI is a comprehensive SaaS solution that helps B2B teams create professional proposals, sales decks,
 and RFP responses using AI. It combines your company's knowledge base with GPT-4 to generate tailored, on-b
rand proposals in minutes.

## 🚀 Features

### Core Features
- **AI-Powered Proposal Builder**: Generate proposals in minutes with GPT-4
- **Brand & Tone Locking**: Maintain consistent brand voice across all content
- **Smart Snippet Reuse**: AI suggests relevant content snippets contextually
- **Multi-format Export**: PDF, Word, PowerPoint, and HTML exports
- **Collaboration Workflow**: Real-time editing, commenting, and approval
- **Template Library**: Pre-built templates for different proposal types
- **Analytics Dashboard**: Track proposal effectiveness and engagement

### Advanced Features
- **Case Study Integration**: Automatically include relevant case studies
- **Pricing Model Management**: Dynamic pricing based on project scope
- **Version Control**: Track changes and maintain proposal history
- **Public Sharing**: Share proposals via secure public URLs
- **Activity Tracking**: Monitor team activity and proposal lifecycle
- **Custom Branding**: Full control over colors, fonts, and styling

## 🛠 Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for API framework
- **PostgreSQL** with Prisma ORM
- **OpenAI GPT-4** for AI generation
- **JWT** for authentication
- **Multer** for file uploads

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for state management
- **React Router** for navigation
- **Framer Motion** for animations
- **Monaco Editor** for rich text editing

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- OpenAI API key
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/proposalai.git
cd proposalai
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/proposalai"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npx prisma db seed
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:server  # Backend on port 3001
npm run dev:client  # Frontend on port 3000
```

## 📁 Project Structure

```
proposalai/
├── src/server/                 # Backend source
│   ├── controllers/           # API controllers
│   ├── middleware/            # Express middleware
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   └── index.ts              # Server entry point
├── client/                    # Frontend source
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── stores/           # State management
│   │   └── types/            # TypeScript types
│   └── public/               # Static assets
├── prisma/                   # Database schema
├── uploads/                  # File uploads
└── docs/                     # Documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Proposals
- `GET /api/proposals` - List proposals
- `POST /api/proposals` - Create proposal
- `GET /api/proposals/:id` - Get proposal
- `PUT /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal
- `POST /api/proposals/generate` - Generate with AI
- `POST /api/proposals/:id/publish` - Publish proposal

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template
- `PUT /api/templates/:id` - Update template

### Snippets
- `GET /api/snippets` - List snippets
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/:id` - Update snippet

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/proposals` - Proposal analytics

## 🎨 Customization

### Branding
Update your organization's branding in the settings:
- Primary and secondary colors
- Font family
- Brand voice and tone
- Logo and styling

### Templates
Create custom templates for different proposal types:
- Sales proposals
- RFP responses
- Pitch decks
- Statements of work

### AI Prompts
Customize AI generation prompts in `src/server/services/aiService.ts`:
- System prompts for different proposal types
- Brand voice instructions
- Content structure preferences

## 🚀 Deployment

### Production Build
```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t proposalai .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET="your-production-jwt-secret"
CORS_ORIGIN="https://yourdomain.com"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.proposalai.com](https://docs.proposalai.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/proposalai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/proposalai/discussions)

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Prisma for excellent ORM
- Tailwind CSS for styling framework
- React team for the amazing framework

---

**ProposalAI** - Transform your proposal process with AI-powered automation. 
