# ProposalAI

A comprehensive proposal management system with AI-powered content generation, client management, and collaboration features.

## Features

- 🤖 **AI-Powered Proposal Generation** - Generate professional proposals using Anthropic Claude Sonnet 4
- 📧 **Email Integration** - Send proposals directly to clients via email
- 👥 **Client Management** - Organize and track client relationships
- 📊 **Analytics & Tracking** - Monitor proposal engagement and effectiveness
- 💬 **Real-time Comments** - Collaborate with team members on proposals
- 🔐 **Secure Access Control** - Control who can view and edit proposals
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Prisma ORM
- **AI**: Anthropic Claude Sonnet 4 (primary), OpenAI GPT-4 (fallback)
- **Email**: SendGrid
- **Authentication**: JWT

## Prerequisites

- Node.js 18+ 
- MongoDB database
- Anthropic API key (recommended) or OpenAI API key

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd proposalai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   # Database
   DATABASE_URL="mongodb://localhost:27017/proposalai"
   
   # AI Provider (Choose one)
   ANTHROPIC_API_KEY=your-anthropic-api-key-here  # Recommended
   # OPENAI_API_KEY=your-openai-api-key-here     # Alternative
   
   # Email (Optional)
   SENDGRID_API_KEY=your-sendgrid-api-key-here
   EMAIL_FROM=ProposalAI <noreply@proposalai.com>
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## AI Provider Setup

### OpenRouter (Recommended - Multiple AI Models)

1. **Get an API key** from [OpenRouter Console](https://openrouter.ai/keys)
2. **Add to your `.env` file**:
   ```env
   OPENROUTER_API_KEY=your-openrouter-api-key-here
   ```
3. **The system will automatically use Claude Sonnet 4** via OpenRouter for all AI operations
4. **Benefits**: Access to multiple AI models (Claude, GPT-4, etc.) through a single API

### Anthropic Claude Sonnet 4 (Direct)

1. **Get an API key** from [Anthropic Console](https://console.anthropic.com/)
2. **Add to your `.env` file**:
   ```env
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```
3. **The system will use Claude Sonnet 4 directly** for all AI operations

### OpenAI GPT-4 (Direct)

1. **Get an API key** from [OpenAI Platform](https://platform.openai.com/)
2. **Add to your `.env` file**:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```
3. **The system will use GPT-4 directly** for all AI operations

## Usage

1. **Create an account** and set up your organization profile
2. **Generate proposals** using AI or start from templates
3. **Send proposals** to clients via email
4. **Track engagement** and receive notifications
5. **Manage clients** and their proposal history

## API Endpoints

### Proposals
- `POST /api/proposals/generate` - Generate AI proposal
- `GET /api/proposals` - List proposals
- `POST /api/proposals/:id/send-email` - Send proposal via email
- `GET /api/public/proposals/:id` - Public proposal view

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details

### Comments
- `GET /api/comments/proposal/:proposalId` - Get proposal comments
- `POST /api/comments` - Add comment

## Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
├── src/
│   ├── server/
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript types
├── prisma/
│   └── schema.prisma      # Database schema
└── package.json
```

### Available Scripts
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with sample data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 
