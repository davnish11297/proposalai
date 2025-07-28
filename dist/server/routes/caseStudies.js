"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const caseStudies = await database_1.prisma.caseStudy.findMany({
            where: { organizationId: authenticatedReq.user.organizationId },
            orderBy: { updatedAt: 'desc' }
        });
        return res.json({
            success: true,
            data: caseStudies
        });
    }
    catch (error) {
        console.error('Get case studies error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch case studies'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedReq = req;
        const caseStudy = await database_1.prisma.caseStudy.findUnique({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!caseStudy) {
            return res.status(404).json({
                success: false,
                error: 'Case study not found'
            });
        }
        return res.json({
            success: true,
            data: caseStudy
        });
    }
    catch (error) {
        console.error('Get case study error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch case study'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { title, description, clientName, industry, challenge, solution, results, metrics } = req.body;
        const authenticatedReq = req;
        if (!title || !description || !challenge || !solution || !results) {
            return res.status(400).json({
                success: false,
                error: 'Title, description, challenge, solution, and results are required'
            });
        }
        const caseStudy = await database_1.prisma.caseStudy.create({
            data: {
                title,
                description,
                clientName,
                industry,
                challenge,
                solution,
                results,
                metrics,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        return res.status(201).json({
            success: true,
            data: caseStudy,
            message: 'Case study created successfully'
        });
    }
    catch (error) {
        console.error('Create case study error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create case study'
        });
    }
});
exports.default = router;
//# sourceMappingURL=caseStudies.js.map