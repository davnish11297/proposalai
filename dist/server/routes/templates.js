"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const templates = await database_1.prisma.template.findMany({
            where: { organizationId: authenticatedReq.user.organizationId },
            orderBy: { updatedAt: 'desc' }
        });
        return res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Get templates error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch templates'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedReq = req;
        const template = await database_1.prisma.template.findUnique({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        return res.json({
            success: true,
            data: template
        });
    }
    catch (error) {
        console.error('Get template error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch template'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, description, category, content, isPublic } = req.body;
        const authenticatedReq = req;
        if (!name || !category || !content) {
            return res.status(400).json({
                success: false,
                error: 'Name, category, and content are required'
            });
        }
        const template = await database_1.prisma.template.create({
            data: {
                name,
                description,
                category,
                content,
                isPublic: isPublic || false,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        return res.status(201).json({
            success: true,
            data: template,
            message: 'Template created successfully'
        });
    }
    catch (error) {
        console.error('Create template error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create template'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, content, isPublic } = req.body;
        const authenticatedReq = req;
        const existingTemplate = await database_1.prisma.template.findFirst({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!existingTemplate) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        const updatedTemplate = await database_1.prisma.template.update({
            where: { id },
            data: {
                name,
                description,
                category,
                content,
                isPublic,
                updatedAt: new Date()
            }
        });
        return res.json({
            success: true,
            data: updatedTemplate,
            message: 'Template updated successfully'
        });
    }
    catch (error) {
        console.error('Update template error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update template'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedReq = req;
        const existingTemplate = await database_1.prisma.template.findFirst({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!existingTemplate) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        await database_1.prisma.template.delete({
            where: { id }
        });
        return res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete template error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete template'
        });
    }
});
exports.default = router;
//# sourceMappingURL=templates.js.map