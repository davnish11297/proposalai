"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentController = exports.CommentController = void 0;
const database_1 = require("../utils/database");
const emailService_1 = require("../services/emailService");
const notificationController_1 = require("./notificationController");
class CommentController {
    async getComments(req, res) {
        try {
            const { proposalId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id: proposalId,
                    organizationId: req.user.organizationId,
                }
            });
            if (!proposal) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            const [comments, total] = await Promise.all([
                database_1.prisma.comment.findMany({
                    where: { proposalId },
                    include: {
                        author: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit),
                }),
                database_1.prisma.comment.count({ where: { proposalId } })
            ]);
            const proposalOwner = await database_1.prisma.proposal.findFirst({
                where: { id: proposalId },
                select: { authorId: true }
            });
            res.json({
                success: true,
                data: comments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch comments'
            });
        }
    }
    async getUnreadCount(req, res) {
        try {
            const { proposalId } = req.params;
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id: proposalId,
                    organizationId: req.user.organizationId,
                }
            });
            if (!proposal) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            const unreadCount = await database_1.prisma.comment.count({
                where: {
                    proposalId,
                    authorId: { not: req.user.userId }
                }
            });
            res.json({
                success: true,
                data: { unreadCount }
            });
        }
        catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch unread count'
            });
        }
    }
    async createComment(req, res) {
        try {
            const { proposalId } = req.params;
            const commentData = req.body;
            const proposalCreate = await database_1.prisma.proposal.findFirst({
                where: {
                    id: proposalId,
                    organizationId: req.user.organizationId,
                }
            });
            if (!proposalCreate) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            const comment = await database_1.prisma.comment.create({
                data: {
                    content: commentData.content,
                    authorId: req.user.userId,
                    proposalId,
                },
                include: {
                    author: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });
            await database_1.prisma.activity.create({
                data: {
                    type: 'COMMENTED',
                    message: `User commented on proposal`,
                    userId: req.user.userId,
                    proposalId,
                    details: JSON.stringify({ commentId: comment.id })
                }
            });
            const proposal = await database_1.prisma.proposal.findFirst({
                where: { id: proposalId },
                include: { author: true }
            });
            if (proposal && proposal.authorId !== req.user.userId) {
                await notificationController_1.notificationController.createNotification({
                    userId: proposal.authorId,
                    type: 'COMMENT',
                    title: 'New Client Comment',
                    message: `A client commented on your proposal "${proposal.title}"`,
                    proposalId,
                    metadata: {
                        commentId: comment.id,
                        clientName: req.user.name || req.user.email
                    }
                });
            }
            const proposalWithComments = await database_1.prisma.proposal.findFirst({
                where: { id: proposalId },
                include: {
                    comments: {
                        where: {
                            author: {
                                isPublicUser: true
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            author: true
                        }
                    }
                }
            });
            if (proposalWithComments && proposalWithComments.comments.length > 0 && proposalWithComments.authorId === req.user.userId) {
                const latestClientComment = proposalWithComments.comments[0];
                let accessCode = '';
                try {
                    const metadata = proposalWithComments.metadata ? JSON.parse(proposalWithComments.metadata) : {};
                    accessCode = metadata.accessCodes?.[0] || '';
                }
                catch (error) {
                    console.error('Error parsing proposal metadata for access code:', error);
                }
                if (accessCode && latestClientComment.author.email) {
                    try {
                        await emailService_1.emailService.sendClientReplyNotificationEmail({
                            to: latestClientComment.author.email,
                            proposalTitle: proposalWithComments.title,
                            proposalId: proposalWithComments.id,
                            ownerName: req.user.name || 'Proposal Owner',
                            replyContent: commentData.content,
                            accessCode
                        });
                    }
                    catch (emailError) {
                        console.error('Failed to send client reply notification:', emailError);
                    }
                }
            }
            res.status(201).json({
                success: true,
                data: comment,
                message: 'Comment added successfully'
            });
        }
        catch (error) {
            console.error('Create comment error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create comment'
            });
        }
    }
    async updateComment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const existingComment = await database_1.prisma.comment.findFirst({
                where: { id },
                include: {
                    proposal: {
                        select: { organizationId: true }
                    }
                }
            });
            if (!existingComment) {
                res.status(404).json({
                    success: false,
                    error: 'Comment not found'
                });
                return;
            }
            if (existingComment.proposal.organizationId !== req.user.organizationId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
                return;
            }
            if (existingComment.authorId !== req.user.userId) {
                res.status(403).json({
                    success: false,
                    error: 'You can only edit your own comments'
                });
                return;
            }
            const comment = await database_1.prisma.comment.update({
                where: { id },
                data: {
                    content: updateData.content,
                    position: updateData.position || null,
                },
                include: {
                    author: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });
            res.json({
                success: true,
                data: comment,
                message: 'Comment updated successfully'
            });
        }
        catch (error) {
            console.error('Update comment error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update comment'
            });
        }
    }
    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            const existingComment = await database_1.prisma.comment.findFirst({
                where: { id },
                include: {
                    proposal: {
                        select: { organizationId: true }
                    }
                }
            });
            if (!existingComment) {
                res.status(404).json({
                    success: false,
                    error: 'Comment not found'
                });
                return;
            }
            if (existingComment.proposal.organizationId !== req.user.organizationId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
                return;
            }
            if (existingComment.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    error: 'You can only delete your own comments'
                });
                return;
            }
            await database_1.prisma.comment.delete({
                where: { id }
            });
            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete comment error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete comment'
            });
        }
    }
}
exports.CommentController = CommentController;
exports.commentController = new CommentController();
//# sourceMappingURL=commentController.js.map