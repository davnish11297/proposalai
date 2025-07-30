"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoClient_1 = require("../utils/mongoClient");
const auth_1 = require("../utils/auth");
const auth_2 = require("../middleware/auth");
const mongodb_1 = require("mongodb");
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
        const { db } = await (0, mongoClient_1.connectToDatabase)();
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }
        const existingOrg = await db.collection('organizations').findOne({ slug: organizationSlug });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                error: 'Organization slug already taken'
            });
        }
        const organizationResult = await db.collection('organizations').insertOne({
            name: organizationName,
            slug: organizationSlug,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const userResult = await db.collection('users').insertOne({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'ADMIN',
            isActive: true,
            organizationId: organizationResult.insertedId,
            onboardingCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const user = {
            id: userResult.insertedId.toString(),
            email,
            firstName,
            lastName,
            role: 'ADMIN',
            organizationId: organizationResult.insertedId.toString(),
            onboardingCompleted: false,
            isActive: true,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const token = (0, auth_1.generateToken)(user);
        return res.status(201).json({
            success: true,
            data: {
                user,
                organization: {
                    id: organizationResult.insertedId.toString(),
                    name: organizationName,
                    slug: organizationSlug,
                    isActive: true
                },
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
        const { db } = await (0, mongoClient_1.connectToDatabase)();
        const user = await db.collection('users').findOne({ email });
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
        const organization = await db.collection('organizations').findOne({
            _id: user.organizationId
        });
        const tokenUser = {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId.toString(),
            isActive: user.isActive || true,
            emailVerified: user.emailVerified || false,
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || new Date()
        };
        const token = (0, auth_1.generateToken)(tokenUser);
        return res.json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organizationId: user.organizationId.toString(),
                    onboardingCompleted: user.onboardingCompleted || false
                },
                organization: organization ? {
                    id: organization._id.toString(),
                    name: organization.name,
                    slug: organization.slug,
                    isActive: organization.isActive
                } : null,
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
        const { db } = await (0, mongoClient_1.connectToDatabase)();
        const user = await db.collection('users').findOne({
            _id: new mongodb_1.ObjectId(authenticatedReq.user.userId)
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const organization = await db.collection('organizations').findOne({
            _id: user.organizationId
        });
        return res.json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organizationId: user.organizationId.toString(),
                    onboardingCompleted: user.onboardingCompleted || false
                },
                organization: organization ? {
                    id: organization._id.toString(),
                    name: organization.name,
                    slug: organization.slug,
                    isActive: organization.isActive
                } : null
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get user'
        });
    }
});
router.post('/onboarding/complete', auth_2.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const { name, privacyMode, industry, goal } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }
        const { db } = await (0, mongoClient_1.connectToDatabase)();
        await db.collection('users').updateOne({ _id: new mongodb_1.ObjectId(authenticatedReq.user.userId) }, {
            $set: {
                firstName: name,
                onboardingCompleted: true,
                privacyMode: privacyMode || false,
                industry: industry || '',
                goal: goal || '',
                updatedAt: new Date()
            }
        });
        return res.json({
            success: true,
            data: {
                message: 'Onboarding completed successfully'
            }
        });
    }
    catch (error) {
        console.error('Onboarding completion error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to complete onboarding'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map