"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const mongoClient_js_1 = require("./utils/mongoClient.js");
const proposals_1 = __importDefault(require("./routes/proposals"));
const comments_1 = __importDefault(require("./routes/comments"));
const teams_1 = __importDefault(require("./routes/teams"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
require("./services/authService");
const pdfService_1 = require("./services/pdfService");
const multer_1 = __importDefault(require("multer"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
});
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
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
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:3008',
    'http://localhost:3009',
    'http://localhost:3010',
    'https://proposalai-app.netlify.app',
    'https://688697ba702b508862421f57--proposalai-app.netlify.app',
    'https://688699ca5aaf0e00088b9001--proposalai-app.netlify.app'
];
if (process.env.CORS_ORIGIN) {
    const envOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    allowedOrigins.push(...envOrigins);
}
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use((0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || process.env.NODE_ENV === 'production' ? '100' : '10000'),
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    skip: (req) => {
        if (process.env.NODE_ENV !== 'production') {
            return req.path === '/health' || req.path.startsWith('/api/public/') || req.path.startsWith('/api/auth/');
        }
        return req.path === '/health' || req.path.startsWith('/api/public/');
    }
});
const notificationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 2 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 30 : 1000,
    message: {
        success: false,
        error: 'Too many notification requests, please try again later.'
    },
    skip: (req) => {
        if (process.env.NODE_ENV !== 'production') {
            return true;
        }
        return false;
    }
});
if (process.env.DISABLE_RATE_LIMITING_IN_DEV === 'true' && process.env.NODE_ENV !== 'production') {
    console.log('⚠️  Rate limiting disabled in development mode');
}
else {
    app.use('/api/', (req, res, next) => {
        if (req.path.startsWith('/auth/')) {
            return next();
        }
        return limiter(req, res, next);
    });
}
app.use('/api/notifications', notificationLimiter);
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'ProposalAI API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.use('/api/auth', require('./routes/auth').default);
app.use('/api/proposals', proposals_1.default);
app.use('/api/comments', comments_1.default);
app.use('/api/teams', teams_1.default);
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
app.use('/api/public/proposals', require('./routes/publicProposals').default);
const pdfService = new pdfService_1.PDFService();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
app.post('/proposals/extract-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }
        const extractedText = await pdfService.extractTextFromBuffer(req.file.buffer);
        return res.json({
            success: true,
            content: extractedText,
            message: 'PDF text extracted successfully'
        });
    }
    catch (error) {
        console.error('PDF extraction error:', error);
        return res.status(500).json({
            error: 'Failed to extract text from PDF',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Something went wrong'
    });
});
const staticPath = path_1.default.join(__dirname, '../../client/build');
const indexPath = path_1.default.join(__dirname, '../../client/build/index.html');
console.log('🔧 Static files path:', staticPath);
console.log('🔧 Index file path:', indexPath);
console.log('🔧 __dirname:', __dirname);
app.use(express_1.default.static(staticPath));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Route not found'
        });
    }
    console.log('🔧 Serving index.html for path:', req.path);
    return res.sendFile(indexPath);
});
async function startServer() {
    try {
        let retries = 3;
        while (retries > 0) {
            try {
                await (0, mongoClient_js_1.connectToDatabase)();
                break;
            }
            catch (error) {
                retries--;
                if (retries === 0) {
                    console.error('Failed to connect to database after 3 attempts:', error);
                    process.exit(1);
                }
                console.log(`Database connection failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        app.listen(PORT, () => {
            console.log(`🚀 ProposalAI server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
startServer();
//# sourceMappingURL=index.js.map