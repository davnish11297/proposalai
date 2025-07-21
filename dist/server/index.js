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
const database_1 = require("./utils/database");
const proposals_1 = __importDefault(require("./routes/proposals"));
const comments_1 = __importDefault(require("./routes/comments"));
const teams_1 = __importDefault(require("./routes/teams"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
require("./services/authService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
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
if (process.env.CORS_ORIGIN)
    allowedOrigins.push(process.env.CORS_ORIGIN);
const corsOptions = process.env.NODE_ENV === 'production'
    ? {
        origin: allowedOrigins,
        credentials: true,
    }
    : {
        origin: function (origin, callback) {
            if (!origin)
                return callback(null, true);
            if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    };
app.use((0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);
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
app.use('/api/public/proposals', require('./routes/publicProposals').default);
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Something went wrong'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
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