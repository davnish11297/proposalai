import express from 'express';
import { authenticateToken } from '../utils/auth';
import { prisma as db } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    
    // Get date range for analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get last 12 months for trend analysis
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Fetch all proposals for the organization
    const [allProposals, recentProposals, previousPeriodProposals, trendProposals] = await Promise.all([
      db.proposal.findMany({
        where: { organizationId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.proposal.findMany({
        where: { 
          organizationId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      db.proposal.findMany({
        where: { 
          organizationId,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      }),
      db.proposal.findMany({
        where: { 
          organizationId,
          createdAt: { gte: twelveMonthsAgo }
        },
        select: { createdAt: true, status: true }
      })
    ]);

    // Calculate proposal statistics
    const totalProposals = allProposals.length;
    const wonProposals = allProposals.filter(p => p.status === 'WON').length;
    const lostProposals = allProposals.filter(p => p.status === 'LOST').length;
    const draftProposals = allProposals.filter(p => p.status === 'DRAFT').length;
    const inReviewProposals = allProposals.filter(p => p.status === 'IN_REVIEW').length;
    const sentProposals = allProposals.filter(p => p.status === 'SENT').length;

    // Calculate win rate
    const totalClosed = wonProposals + lostProposals;
    const winRate = totalClosed > 0 ? Math.round((wonProposals / totalClosed) * 100) : 0;

    // Calculate pipeline value (sum of all proposal budgets)
    const pipelineValue = allProposals.reduce((sum, proposal) => {
      const content = proposal.content as any;
      const budget = content?.budget || content?.budgetDetails?.total || '$0';
      const value = parseInt(budget.toString().replace(/[^0-9]/g, '')) || 0;
      return sum + value;
    }, 0);

    // Calculate average proposal value
    const averageValue = totalProposals > 0 ? Math.round(pipelineValue / totalProposals) : 0;

    // Calculate proposals by type
    const proposalsByType = allProposals.reduce((acc, proposal) => {
      acc[proposal.type] = (acc[proposal.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate proposals by status
    const proposalsByStatus = {
      DRAFT: draftProposals,
      IN_REVIEW: inReviewProposals,
      SENT: sentProposals,
      WON: wonProposals,
      LOST: lostProposals,
      APPROVED: allProposals.filter(p => p.status === 'APPROVED').length,
      EXPIRED: allProposals.filter(p => p.status === 'EXPIRED').length
    };

    // Calculate monthly trends for the last 12 months
    const monthlyTrends: Array<{ month: string; count: number; won: number }> = [];
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
      
      const monthProposals = trendProposals.filter(p => 
        p.createdAt >= monthStart && p.createdAt <= monthEnd
      );
      
      monthlyTrends.push({
        month: months[monthStart.getMonth()],
        count: monthProposals.length,
        won: monthProposals.filter(p => p.status === 'WON').length
      });
    }

    // Calculate recent activity (last 10 activities)
    const recentActivities = await db.activity.findMany({
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

    // Calculate monthly trends
    const currentMonthCount = recentProposals.length;
    const previousMonthCount = previousPeriodProposals.length;
    const monthOverMonthChange = previousMonthCount > 0 
      ? Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100)
      : currentMonthCount > 0 ? 100 : 0;

    // Calculate average response time (time from creation to first activity)
    const proposalsWithActivities = allProposals.filter(p => p.activities.length > 0);
    const averageResponseTime = proposalsWithActivities.length > 0 
      ? proposalsWithActivities.reduce((sum, p) => {
          const firstActivity = p.activities[0];
          const responseTime = firstActivity.createdAt.getTime() - p.createdAt.getTime();
          return sum + responseTime;
        }, 0) / proposalsWithActivities.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Get top performing users
    const userStats = await db.user.findMany({
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

    // Calculate time saved (estimated 3 hours per proposal)
    const totalTimeSaved = totalProposals * 3; // hours
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
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

export default router; 