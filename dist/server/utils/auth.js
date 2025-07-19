"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.generatePublicUrl = generatePublicUrl;
exports.generateSecureToken = generateSecureToken;
exports.authenticateToken = authenticateToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
}
async function comparePassword(password, hashedPassword) {
    return bcryptjs_1.default.compare(password, hashedPassword);
}
function generateToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
function generatePublicUrl(proposalId) {
    const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    return `${baseUrl}/proposal/${proposalId}`;
}
function generateSecureToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
    req.user = payload;
    next();
}
//# sourceMappingURL=auth.js.map