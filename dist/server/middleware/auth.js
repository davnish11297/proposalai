"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
exports.requireOrganization = requireOrganization;
exports.optionalAuth = optionalAuth;
const auth_1 = require("../utils/auth");
const database_1 = require("../utils/database");
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required'
            });
            return;
        }
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
            return;
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.userId }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User account not found'
            });
            return;
        }
        req.user = {
            ...payload,
            organizationId: user.organizationId
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        const authenticatedReq = req;
        if (!authenticatedReq.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(authenticatedReq.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
}
function requireOrganization(req, res, next) {
    const authenticatedReq = req;
    if (!authenticatedReq.user?.organizationId) {
        res.status(403).json({
            success: false,
            error: 'Organization membership required'
        });
        return;
    }
    next();
}
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const payload = (0, auth_1.verifyToken)(token);
            if (payload) {
                req.user = payload;
            }
        }
    }
    catch (error) {
    }
    next();
}
//# sourceMappingURL=auth.js.map