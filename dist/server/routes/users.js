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
        const organizationId = req.user.organizationId;
        const teamId = req.query.teamId;
        let users = await database_1.prisma.user.findMany({
            where: {
                organizationId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            orderBy: { name: 'asc' },
        });
        if (teamId) {
            const teamMembers = await database_1.prisma.teamMember.findMany({
                where: { teamId },
                select: { userId: true },
            });
            const memberIds = new Set(teamMembers.map(m => m.userId));
            users = users.filter(u => !memberIds.has(u.id));
        }
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map