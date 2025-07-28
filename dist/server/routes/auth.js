"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../utils/auth");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, organizationName, organizationSlug } = req.body;
        if (!email || !password || !firstName || !lastName || !organizationName || !organizationSlug) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }
        const existingOrg = await database_1.prisma.organization.findUnique({
            where: { slug: organizationSlug }
        });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                error: 'Organization slug already taken'
            });
        }
        const organization = await database_1.prisma.organization.create({
            data: {
                name: organizationName,
                slug: organizationSlug,
                isActive: true
            }
        });
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: 'ADMIN',
                isActive: true,
                organizationId: organization.id
            }
        });
        const token = (0, auth_1.generateToken)(user);
        return res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organizationId: user.organizationId
                },
                organization,
                token
            },
            message: 'User registered successfully'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to register user'
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: {
                organization: true
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const isValidPassword = await (0, auth_1.comparePassword)(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        const token = (0, auth_1.generateToken)(user);
        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organizationId: user.organizationId
                },
                organization: user.organization,
                token
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to login'
        });
    }
});
router.get('/me', auth_2.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const user = await database_1.prisma.user.findUnique({
            where: { id: authenticatedReq.user.userId },
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
        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organizationId: user.organizationId
                },
                organization: user.organization
            }
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get current user'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map