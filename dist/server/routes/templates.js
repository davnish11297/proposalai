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
        const templates = await database_1.prisma.template.findMany({
            where: {
                isActive: true,
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch templates'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {},
            message: 'Template detail endpoint - implementation pending'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch template'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {},
            message: 'Create template endpoint - implementation pending'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create template'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {},
            message: 'Update template endpoint - implementation pending'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update template'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Delete template endpoint - implementation pending'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete template'
        });
    }
});
exports.default = router;
//# sourceMappingURL=templates.js.map