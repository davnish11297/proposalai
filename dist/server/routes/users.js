"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        let users = await database_1.prisma.user.findMany({
            where: { organizationId: authenticatedReq.user.organizationId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        const teamMembers = await database_1.prisma.teamMember.findMany({
            where: { organizationId: authenticatedReq.user.organizationId },
            include: {
                team: true
            }
        });
        users = users.map(user => ({
            ...user,
            teams: teamMembers
                .filter(member => member.userId === user.id)
                .map(member => ({
                teamId: member.teamId,
                teamName: member.team.name,
                role: member.role
            }))
        }));
        return res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map