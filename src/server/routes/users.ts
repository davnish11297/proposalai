import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/database';

const router = express.Router();

// GET /api/users?teamId=optional
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const teamId = req.query.teamId as string | undefined;

    // Get all users in the org
    let users = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
      },
      orderBy: { firstName: 'asc' },
    });

    // If teamId is provided, filter out users already in the team
    if (teamId) {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId, isActive: true },
        select: { userId: true },
      });
      const memberIds = new Set(teamMembers.map(m => m.userId));
      users = users.filter(u => !memberIds.has(u.id));
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

export default router; 