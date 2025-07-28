"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamController = exports.TeamController = void 0;
const database_1 = require("../utils/database");
class TeamController {
    async getTeams(req, res) {
        try {
            const teams = await database_1.prisma.team.findMany({
                where: { organizationId: req.user.organizationId },
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
                members: team.members.map((member) => ({
                    id: member.id,
                    role: member.role,
                    user: member.user
                }))
            }));
            return res.json({
                success: true,
                data: teamsWithStats
            });
        }
        catch (error) {
            console.error('Get teams error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch teams'
            });
        }
    }
    async getTeam(req, res) {
        try {
            const { id } = req.params;
            const team = await database_1.prisma.team.findFirst({
                where: {
                    id,
                    organizationId: req.user.organizationId,
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
        }
        catch (error) {
            console.error('Get team error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch team',
            });
        }
    }
    async createTeam(req, res) {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'Team name is required'
                });
            }
            const existingTeam = await database_1.prisma.team.findFirst({
                where: {
                    name,
                    organizationId: req.user.organizationId
                }
            });
            if (existingTeam) {
                return res.status(400).json({
                    success: false,
                    error: 'Team with this name already exists'
                });
            }
            const team = await database_1.prisma.team.create({
                data: {
                    name,
                    description,
                    organizationId: req.user.organizationId
                }
            });
            return res.status(201).json({
                success: true,
                data: team,
                message: 'Team created successfully'
            });
        }
        catch (error) {
            console.error('Create team error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create team'
            });
        }
    }
    async updateTeam(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const teamMember = await database_1.prisma.teamMember.findFirst({
                where: {
                    teamId: id,
                    userId: req.user.userId,
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
            const team = await database_1.prisma.team.update({
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
        }
        catch (error) {
            console.error('Update team error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update team',
            });
        }
    }
    async deleteTeam(req, res) {
        try {
            const { id } = req.params;
            const teamMember = await database_1.prisma.teamMember.findFirst({
                where: {
                    teamId: id,
                    userId: req.user.userId,
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
            await database_1.prisma.team.update({
                where: { id },
                data: { isActive: false },
            });
            res.json({
                success: true,
                message: 'Team deleted successfully',
            });
        }
        catch (error) {
            console.error('Delete team error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete team',
            });
        }
    }
    async addTeamMember(req, res) {
        try {
            const { teamId } = req.params;
            const memberData = req.body;
            const teamMember = await database_1.prisma.teamMember.findFirst({
                where: {
                    teamId,
                    userId: req.user.userId,
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
            const user = await database_1.prisma.user.findFirst({
                where: {
                    email: memberData.email,
                    organizationId: req.user.organizationId,
                },
            });
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found in your organization',
                });
                return;
            }
            const existingMember = await database_1.prisma.teamMember.findFirst({
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
            const newMember = await database_1.prisma.teamMember.create({
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
        }
        catch (error) {
            console.error('Add team member error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add team member',
            });
        }
    }
    async updateTeamMember(req, res) {
        try {
            const { teamId, memberId } = req.params;
            const updateData = req.body;
            const teamMember = await database_1.prisma.teamMember.findFirst({
                where: {
                    teamId,
                    userId: req.user.userId,
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
            const updatedMember = await database_1.prisma.teamMember.update({
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
        }
        catch (error) {
            console.error('Update team member error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update team member',
            });
        }
    }
    async removeTeamMember(req, res) {
        try {
            const { teamId, memberId } = req.params;
            const teamMember = await database_1.prisma.teamMember.findFirst({
                where: {
                    teamId,
                    userId: req.user.userId,
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
            await database_1.prisma.teamMember.delete({
                where: { id: memberId },
            });
            res.json({
                success: true,
                message: 'Team member removed successfully',
            });
        }
        catch (error) {
            console.error('Remove team member error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove team member',
            });
        }
    }
    async getTeamProposals(req, res) {
        try {
            const { teamId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const teamMember = await database_1.prisma.teamMember.findFirst({
                where: {
                    teamId,
                    userId: req.user.userId,
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
                database_1.prisma.proposal.findMany({
                    where: {
                        teamId,
                        organizationId: req.user.organizationId,
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
                database_1.prisma.proposal.count({
                    where: {
                        teamId,
                        organizationId: req.user.organizationId,
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
        }
        catch (error) {
            console.error('Get team proposals error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch team proposals',
            });
        }
    }
}
exports.TeamController = TeamController;
exports.teamController = new TeamController();
//# sourceMappingURL=teamController.js.map