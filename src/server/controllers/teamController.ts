import { Response } from 'express';
import { prisma as db } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { ICreateTeam, IUpdateTeam, IAddTeamMember, IUpdateTeamMember } from '../types';

export class TeamController {
  // Get all teams for the organization
  async getTeams(req: AuthenticatedRequest, res: Response) {
    try {
      const teams = await db.team.findMany({
        where: { organizationId: req.user!.organizationId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const teamsWithStats = teams.map(team => ({
        ...team,
        memberCount: team.members.length,
        members: team.members.map((member: any) => ({
          id: member.id,
          role: member.role,
          user: member.user
        }))
      }));

      return res.json({
        success: true,
        data: teamsWithStats
      });
    } catch (error) {
      console.error('Get teams error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch teams'
      });
    }
  }

  // Get a single team by ID
  async getTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const team = await db.team.findFirst({
        where: {
          id,
          organizationId: req.user!.organizationId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          proposals: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              members: true,
              proposals: true,
            },
          },
        },
      });

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team',
      });
    }
  }

  // Create a new team
  async createTeam(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Team name is required'
        });
      }

      // Check if team name already exists in organization
      const existingTeam = await db.team.findFirst({
        where: {
          name,
          organizationId: req.user!.organizationId
        }
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          error: 'Team with this name already exists'
        });
      }

      const team = await db.team.create({
        data: {
          name,
          description,
          organizationId: req.user!.organizationId!
        }
      });

      return res.status(201).json({
        success: true,
        data: team,
        message: 'Team created successfully'
      });
    } catch (error) {
      console.error('Create team error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create team'
      });
    }
  }

  // Update a team
  async updateTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: IUpdateTeam = req.body;

      // Check if user is team admin
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: id,
          userId: req.user!.userId!,
          role: 'ADMIN',
        },
      });

      if (!teamMember) {
        res.status(403).json({
          success: false,
          message: 'Only team admins can update team details',
        });
        return;
      }

      const team = await db.team.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              proposals: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: team,
        message: 'Team updated successfully',
      });
    } catch (error) {
      console.error('Update team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team',
      });
    }
  }

  // Delete a team
  async deleteTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user is team admin
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId: id,
          userId: req.user!.userId!,
          role: 'ADMIN',
        },
      });

      if (!teamMember) {
        res.status(403).json({
          success: false,
          message: 'Only team admins can delete teams',
        });
        return;
      }

      await db.team.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete team',
      });
    }
  }

  // Add team member
  async addTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      const memberData: IAddTeamMember = req.body;

      // Check if user is team admin
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId,
          userId: req.user!.userId!,
          role: 'ADMIN',
        },
      });

      if (!teamMember) {
        res.status(403).json({
          success: false,
          message: 'Only team admins can add members',
        });
        return;
      }

      // Find user by email
      const user = await db.user.findFirst({
        where: {
          email: memberData.email,
          organizationId: req.user!.organizationId,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found in your organization',
        });
        return;
      }

      // Check if user is already a member
      const existingMember = await db.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id,
        },
      });

      if (existingMember) {
        res.status(400).json({
          success: false,
          message: 'User is already a member of this team',
        });
        return;
      }

      const newMember = await db.teamMember.create({
        data: {
          teamId,
          userId: user.id,
          role: memberData.role || 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: newMember,
        message: 'Team member added successfully',
      });
    } catch (error) {
      console.error('Add team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add team member',
      });
    }
  }

  // Update team member role
  async updateTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { teamId, memberId } = req.params;
      const updateData: IUpdateTeamMember = req.body;

      // Check if user is team admin
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId,
          userId: req.user!.userId!,
          role: 'ADMIN',
        },
      });

      if (!teamMember) {
        res.status(403).json({
          success: false,
          message: 'Only team admins can update member roles',
        });
        return;
      }

      const updatedMember = await db.teamMember.update({
        where: { id: memberId },
        data: { role: updateData.role },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedMember,
        message: 'Team member updated successfully',
      });
    } catch (error) {
      console.error('Update team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team member',
      });
    }
  }

  // Remove team member
  async removeTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { teamId, memberId } = req.params;

      // Check if user is team admin
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId,
          userId: req.user!.userId!,
          role: 'ADMIN',
        },
      });

      if (!teamMember) {
        res.status(403).json({
          success: false,
          message: 'Only team admins can remove members',
        });
        return;
      }

      await db.teamMember.delete({
        where: { id: memberId },
      });

      res.json({
        success: true,
        message: 'Team member removed successfully',
      });
    } catch (error) {
      console.error('Remove team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove team member',
      });
    }
  }

  // Get team proposals
  async getTeamProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Check if user is team member
      const teamMember = await db.teamMember.findFirst({
        where: {
          teamId,
          userId: req.user!.userId!,
        },
      });

      if (!teamMember) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const [proposals, total] = await Promise.all([
        db.proposal.findMany({
          where: {
            teamId,
            organizationId: req.user!.organizationId,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                comments: true,
                activities: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        db.proposal.count({
          where: {
            teamId,
            organizationId: req.user!.organizationId,
          },
        }),
      ]);

      res.json({
        success: true,
        data: proposals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get team proposals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team proposals',
      });
    }
  }
}

export const teamController = new TeamController(); 