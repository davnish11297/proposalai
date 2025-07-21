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
        const snippets = await database_1.prisma.snippet.findMany({
            orderBy: { usageCount: 'desc' }
        });
        res.json({
            success: true,
            data: snippets
        });
    }
    catch (error) {
        console.error('Get snippets error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch snippets'
        });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
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
router.post('/:id/increment-usage', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const snippet = await database_1.prisma.snippet.findFirst({
            where: {
                id,
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
                usageCount: {
                    increment: 1
                }
            }
        });
        return res.json({
            success: true,
            data: updatedSnippet,
            message: 'Usage count incremented successfully'
        });
    }
    catch (error) {
        console.error('Increment snippet usage error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to increment usage count'
        });
    }
});
exports.default = router;
//# sourceMappingURL=snippets.js.map