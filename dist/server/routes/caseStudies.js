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
        const caseStudies = await database_1.prisma.caseStudy.findMany({
            where: {
                organizationId: req.user.organizationId,
                isActive: true,
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({
            success: true,
            data: caseStudies
        });
    }
    catch (error) {
        console.error('Get case studies error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch case studies'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { title, description, clientName, industry, challenge, solution, results, metrics } = req.body;
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
                clientName: clientName || null,
                industry: industry || null,
                challenge,
                solution,
                results,
                metrics: metrics || null,
                organizationId: req.user.organizationId,
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