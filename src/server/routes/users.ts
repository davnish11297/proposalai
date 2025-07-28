import { Router } from 'express';
import { prisma } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all users for the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    let users = await prisma.user.findMany({
      where: { organizationId: authenticatedReq.user!.organizationId },
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

    // Get team members for each user
    const teamMembers = await prisma.teamMember.findMany({
      where: { organizationId: authenticatedReq.user!.organizationId },
      include: {
        team: true
      }
    });

    // Add team information to users
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
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

export default router; 