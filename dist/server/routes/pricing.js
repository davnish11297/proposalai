"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const pricingModels = await database_1.prisma.pricingModel.findMany({
            where: { organizationId: authenticatedReq.user.organizationId },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({
            success: true,
            data: pricingModels
        });
    }
    catch (error) {
        console.error('Get pricing models error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch pricing models'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedReq = req;
        const pricingModel = await database_1.prisma.pricingModel.findUnique({
            where: {
                id,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!pricingModel) {
            return res.status(404).json({
                success: false,
                error: 'Pricing model not found'
            });
        }
        return res.json({
            success: true,
            data: pricingModel
        });
    }
    catch (error) {
        console.error('Get pricing model error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch pricing model'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, description, pricing } = req.body;
        const authenticatedReq = req;
        if (!name || !pricing) {
            return res.status(400).json({
                success: false,
                error: 'Name and pricing are required'
            });
        }
        const pricingModel = await database_1.prisma.pricingModel.create({
            data: {
                name,
                description,
                pricing,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        return res.status(201).json({
            success: true,
            data: pricingModel,
            message: 'Pricing model created successfully'
        });
    }
    catch (error) {
        console.error('Create pricing model error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create pricing model'
        });
    }
});
exports.default = router;
//# sourceMappingURL=pricing.js.map