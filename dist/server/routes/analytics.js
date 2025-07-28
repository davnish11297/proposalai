"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const organizationId = authenticatedReq.user.organizationId;
        const totalProposals = await database_1.prisma.proposal.count({
            where: { organizationId }
        });
        const proposalsByStatus = await database_1.prisma.proposal.groupBy({
            by: ['status'],
            where: { organizationId },
            _count: { status: true }
        });
        const proposalsByType = await database_1.prisma.proposal.groupBy({
            by: ['type'],
            where: { organizationId },
            _count: { type: true }
        });
        const recentActivity = await database_1.prisma.activity.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                proposal: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        const topTemplates = await database_1.prisma.template.findMany({
            where: { organizationId },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });
        const publishedProposals = await database_1.prisma.proposal.count({
            where: {
                organizationId,
                status: 'PUBLISHED'
            }
        });
        const conversionRate = totalProposals > 0 ? (publishedProposals / totalProposals) * 100 : 0;
        return res.json({
            success: true,
            data: {
                totalProposals,
                proposalsByStatus: proposalsByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {}),
                proposalsByType: proposalsByType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {}),
                recentActivity,
                topTemplates,
                conversionRate: Math.round(conversionRate * 100) / 100
            }
        });
    }
    catch (error) {
        console.error('Get analytics error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map