"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const database_1 = require("../utils/database");
const auth_2 = require("../utils/auth");
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_1 = __importDefault(require("passport"));
const router = express_1.default.Router();
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
];
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
];
router.post('/login', loginValidation, validation_1.validateRequest, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: {
                organization: true
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        const token = (0, auth_2.generateToken)(user);
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: {
                token,
                user: userWithoutPassword
            }
        });
        return;
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
        return;
    }
});
router.post('/register', registerValidation, validation_1.validateRequest, async (req, res) => {
    try {
        const { email, password, firstName, lastName, organizationName } = req.body;
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        const organization = await database_1.prisma.organization.create({
            data: {
                name: organizationName,
                description: `Organization for ${organizationName}`,
                industry: 'Technology'
            }
        });
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: `${firstName} ${lastName}`,
                role: 'ADMIN',
                organizationId: organization.id
            },
            include: {
                organization: true
            }
        });
        const token = (0, auth_2.generateToken)(user);
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: {
                token,
                user: userWithoutPassword
            }
        });
        return;
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
        return;
    }
});
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const userId = req.user.userId;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: userWithoutPassword
        });
        return;
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user data'
        });
        return;
    }
});
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login', session: false }), async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ success: false, error: 'Google authentication failed' });
    }
    const token = (0, auth_2.generateToken)(user);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?token=${token}`);
});
exports.default = router;
//# sourceMappingURL=auth.js.map