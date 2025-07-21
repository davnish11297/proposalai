"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../utils/auth");
const database_1 = require("../utils/database");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const [allProposals, recentProposals, previousPeriodProposals, trendProposals] = await Promise.all([
            database_1.prisma.proposal.findMany({
                where: { organizationId },
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    activities: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { createdAt: 'desc' }
            }),
            database_1.prisma.proposal.findMany({
                where: {
                    organizationId,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            database_1.prisma.proposal.findMany({
                where: {
                    organizationId,
                    createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
                }
            }),
            database_1.prisma.proposal.findMany({
                where: {
                    organizationId,
                    createdAt: { gte: twelveMonthsAgo }
                },
                select: { createdAt: true, status: true }
            })
        ]);
        const totalProposals = allProposals.length;
        const wonProposals = allProposals.filter(p => p.status === 'WON').length;
        const lostProposals = allProposals.filter(p => p.status === 'LOST').length;
        const draftProposals = allProposals.filter(p => p.status === 'DRAFT').length;
        const inReviewProposals = allProposals.filter(p => p.status === 'IN_REVIEW').length;
        const sentProposals = allProposals.filter(p => p.status === 'SENT').length;
        const totalClosed = wonProposals + lostProposals;
        const winRate = totalClosed > 0 ? Math.round((wonProposals / totalClosed) * 100) : 0;
        const pipelineValue = allProposals.reduce((sum, proposal) => {
            const content = proposal.content;
            const budget = content?.budget || content?.budgetDetails?.total || '$0';
            const value = parseInt(budget.toString().replace(/[^0-9]/g, '')) || 0;
            return sum + value;
        }, 0);
        const averageValue = totalProposals > 0 ? Math.round(pipelineValue / totalProposals) : 0;
        const proposalsByType = allProposals.reduce((acc, proposal) => {
            acc[proposal.type] = (acc[proposal.type] || 0) + 1;
            return acc;
        }, {});
        const proposalsByStatus = {
            DRAFT: draftProposals,
            IN_REVIEW: inReviewProposals,
            SENT: sentProposals,
            WON: wonProposals,
            LOST: lostProposals,
            APPROVED: allProposals.filter(p => p.status === 'APPROVED').length,
            EXPIRED: allProposals.filter(p => p.status === 'EXPIRED').length
        };
        const monthlyTrends = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);
            monthEnd.setHours(23, 59, 59, 999);
            const monthProposals = trendProposals.filter(p => p.createdAt >= monthStart && p.createdAt <= monthEnd);
            monthlyTrends.push({
                month: months[monthStart.getMonth()],
                count: monthProposals.length,
                won: monthProposals.filter(p => p.status === 'WON').length
            });
        }
        const recentActivities = await database_1.prisma.activity.findMany({
            where: {
                proposal: { organizationId },
                createdAt: { gte: thirtyDaysAgo }
            },
            include: {
                user: { select: { firstName: true, lastName: true } },
                proposal: { select: { title: true, clientName: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const currentMonthCount = recentProposals.length;
        const previousMonthCount = previousPeriodProposals.length;
        const monthOverMonthChange = previousMonthCount > 0
            ? Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100)
            : currentMonthCount > 0 ? 100 : 0;
        const proposalsWithActivities = allProposals.filter(p => p.activities.length > 0);
        const averageResponseTime = proposalsWithActivities.length > 0
            ? proposalsWithActivities.reduce((sum, p) => {
                const firstActivity = p.activities[0];
                const responseTime = firstActivity.createdAt.getTime() - p.createdAt.getTime();
                return sum + responseTime;
            }, 0) / proposalsWithActivities.length / (1000 * 60 * 60 * 24)
            : 0;
        const userStats = await database_1.prisma.user.findMany({
            where: { organizationId },
            include: {
                _count: { select: { proposals: true } },
                proposals: {
                    where: { status: 'WON' },
                    select: { id: true }
                }
            }
        });
        const topPerformers = userStats
            .map(user => ({
            name: `${user.firstName} ${user.lastName}`,
            totalProposals: user._count.proposals,
            wonProposals: user.proposals.length,
            winRate: user._count.proposals > 0 ? Math.round((user.proposals.length / user._count.proposals) * 100) : 0
        }))
            .sort((a, b) => b.wonProposals - a.wonProposals)
            .slice(0, 5);
        const totalTimeSaved = totalProposals * 3;
        const timeSavedThisMonth = currentMonthCount * 3;
        res.json({
            success: true,
            data: {
                overview: {
                    totalProposals,
                    winRate: `${winRate}%`,
                    averageValue: `$${averageValue.toLocaleString()}`,
                    pipelineValue: `$${(pipelineValue / 1000).toFixed(0)}K`,
                    monthOverMonthChange: `${monthOverMonthChange > 0 ? '+' : ''}${monthOverMonthChange}%`,
                    averageResponseTime: `${averageResponseTime.toFixed(1)} days`,
                    timeSaved: `${totalTimeSaved}h`,
                    timeSavedThisMonth: `${timeSavedThisMonth}h`
                },
                proposalsByStatus,
                proposalsByType,
                monthlyTrends,
                recentActivity: recentActivities.map(activity => ({
                    id: activity.id,
                    type: activity.type,
                    details: activity.details,
                    createdAt: activity.createdAt,
                    user: activity.user,
                    proposal: activity.proposal
                })),
                topPerformers,
                trends: {
                    currentMonth: currentMonthCount,
                    previousMonth: previousMonthCount,
                    change: monthOverMonthChange
                }
            }
        });
    }
    catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map