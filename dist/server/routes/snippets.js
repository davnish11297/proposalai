"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const snippets = await database_1.prisma.snippet.findMany({
            where: { organizationId: authenticatedReq.user.organizationId },
            orderBy: { updatedAt: 'desc' }
        });
        return res.json({
            success: true,
            data: snippets
        });
    }
    catch (error) {
        console.error('Get snippets error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch snippets'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedReq = req;
        const snippet = await database_1.prisma.snippet.findUnique({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!snippet) {
            return res.status(404).json({
                success: false,
                error: 'Snippet not found'
            });
        }
        return res.json({
            success: true,
            data: snippet
        });
    }
    catch (error) {
        console.error('Get snippet error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch snippet'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const authenticatedReq = req;
        if (!title || !content || !category) {
            return res.status(400).json({
                success: false,
                error: 'Title, content, and category are required'
            });
        }
        const snippet = await database_1.prisma.snippet.create({
            data: {
                title,
                content,
                category,
                tags: tags || [],
                organizationId: authenticatedReq.user.organizationId
            }
        });
        return res.status(201).json({
            success: true,
            data: snippet,
            message: 'Snippet created successfully'
        });
    }
    catch (error) {
        console.error('Create snippet error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create snippet'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, tags } = req.body;
        const authenticatedReq = req;
        const existingSnippet = await database_1.prisma.snippet.findFirst({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!existingSnippet) {
            return res.status(404).json({
                success: false,
                error: 'Snippet not found'
            });
        }
        const updatedSnippet = await database_1.prisma.snippet.update({
            where: { id },
            data: {
                title,
                content,
                category,
                tags,
                updatedAt: new Date()
            }
        });
        return res.json({
            success: true,
            data: updatedSnippet,
            message: 'Snippet updated successfully'
        });
    }
    catch (error) {
        console.error('Update snippet error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update snippet'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedReq = req;
        const existingSnippet = await database_1.prisma.snippet.findFirst({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!existingSnippet) {
            return res.status(404).json({
                success: false,
                error: 'Snippet not found'
            });
        }
        await database_1.prisma.snippet.delete({
            where: { id }
        });
        return res.json({
            success: true,
            message: 'Snippet deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete snippet error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete snippet'
        });
    }
});
router.post('/:id/increment-usage', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedReq = req;
        const snippet = await database_1.prisma.snippet.findFirst({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!snippet) {
            return res.status(404).json({
                success: false,
                error: 'Snippet not found'
            });
        }
        const updatedSnippet = await database_1.prisma.snippet.update({
            where: { id },
            data: {
                usageCount: snippet.usageCount + 1
            }
        });
        return res.json({
            success: true,
            data: updatedSnippet,
            message: 'Usage count incremented'
        });
    }
    catch (error) {
        console.error('Increment usage error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to increment usage count'
        });
    }
});
exports.default = router;
//# sourceMappingURL=snippets.js.map