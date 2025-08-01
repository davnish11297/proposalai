import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase, prisma } from './utils/database';
import proposalsRouter from './routes/proposals';
import commentsRouter from './routes/comments';
import teamsRouter from './routes/teams';
import session from 'express-session';
import passport from 'passport';
import './services/authService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting and X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Session middleware (should be before passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  'http://localhost:3007',
  'http://localhost:3008',
  'http://localhost:3009',
  'http://localhost:3010'
];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);

// In development, allow all localhost origins
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: allowedOrigins,
      credentials: true,
    }
  : {
      origin: function (origin: string | undefined, callback: Function) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost origins
        if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
          return callback(null, true);
        }
        
        // Allow specific origins
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    };

app.use(cors(corsOptions));

// Rate limiting - More lenient in development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || process.env.NODE_ENV === 'production' ? '100' : '10000'), // Much more lenient in development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for health checks, public proposals, and auth routes in development
    if (process.env.NODE_ENV !== 'production') {
      return req.path === '/health' || req.path.startsWith('/api/public/') || req.path.startsWith('/api/auth/');
    }
    // In production, only skip health checks and public routes
    return req.path === '/health' || req.path.startsWith('/api/public/');
  }
});

// More lenient rate limiting for notification endpoints
const notificationLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 1000, // Much more lenient for notifications
  message: {
    success: false,
    error: 'Too many notification requests, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for notifications in development
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  }
});

// Apply rate limiting to all routes EXCEPT auth routes
// Skip entirely if DISABLE_RATE_LIMITING_IN_DEV is set to true in development
if (process.env.DISABLE_RATE_LIMITING_IN_DEV === 'true' && process.env.NODE_ENV !== 'production') {
  console.log('⚠️  Rate limiting disabled in development mode');
} else {
  app.use('/api/', (req, res, next) => {
    // Skip rate limiting for auth routes
    if (req.path.startsWith('/auth/')) {
      return next();
    }
    return limiter(req, res, next);
  });
}

app.use('/api/notifications', notificationLimiter);

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProposalAI API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes (to be implemented)
app.use('/api/auth', require('./routes/auth').default);
app.use('/api/proposals', proposalsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/templates', require('./routes/templates').default);
app.use('/api/snippets', require('./routes/snippets').default);
app.use('/api/case-studies', require('./routes/caseStudies').default);
app.use('/api/pricing', require('./routes/pricing').default);
app.use('/api/organizations', require('./routes/organizations').default);
app.use('/api/users', require('./routes/users').default);
app.use('/api/analytics', require('./routes/analytics').default);
app.use('/api/clients', require('./routes/clients').default);
app.use('/api/email-tracking', require('./routes/emailTracking').default);
app.use('/api/notifications', require('./routes/notifications').default);

// Public proposal route
app.use('/api/public/proposals', require('./routes/publicProposals').default);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 ProposalAI server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer(); 