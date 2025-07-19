"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../utils/database");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const pricingModels = await database_1.prisma.pricingModel.findMany({
            where: {
                organizationId: req.user.organizationId,
                isActive: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: pricingModels
        });
    }
    catch (error) {
        console.error('Get pricing models error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pricing models'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, description, pricing } = req.body;
        if (!name || !pricing) {
            return res.status(400).json({
                success: false,
                error: 'Name and pricing are required'
            });
        }
        const pricingModel = await database_1.prisma.pricingModel.create({
            data: {
                name,
                description: description || null,
                pricing,
                organizationId: req.user.organizationId,
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