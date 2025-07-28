import { Router } from 'express';
import { prisma } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get analytics for the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const organizationId = authenticatedReq.user!.organizationId;

    // Get total proposals
    const totalProposals = await prisma.proposal.count({
      where: { organizationId }
    });

    // Get proposals by status
    const proposalsByStatus = await prisma.proposal.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { status: true }
    });

    // Get proposals by type
    const proposalsByType = await prisma.proposal.groupBy({
      by: ['type'],
      where: { organizationId },
      _count: { type: true }
    });

    // Get recent activity
    const recentActivity = await prisma.activity.findMany({
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

    // Get top templates
    const topTemplates = await prisma.template.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Calculate conversion rate (published proposals / total proposals)
    const publishedProposals = await prisma.proposal.count({
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
        proposalsByStatus: proposalsByStatus.reduce((acc: Record<string, number>, item: any) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        proposalsByType: proposalsByType.reduce((acc: Record<string, number>, item: any) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {}),
        recentActivity,
        topTemplates,
        conversionRate: Math.round(conversionRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

export default router; 