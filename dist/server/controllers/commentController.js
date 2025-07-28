"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentController = exports.CommentController = void 0;
const database_1 = require("../utils/database");
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
            const { content } = req.body;
            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment content is required'
                });
            }
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id: proposalId,
                    organizationId: req.user.organizationId
                }
            });
            if (!proposal) {
                return res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
            }
            const comment = await database_1.prisma.comment.create({
                data: {
                    content,
                    userId: req.user.userId,
                    proposalId,
                    organizationId: req.user.organizationId
                }
            });
            await notificationController_1.notificationController.createNotification({
                userId: proposal.userId,
                type: 'COMMENT_ADDED',
                title: 'New Comment',
                message: `New comment added to proposal "${proposal.title}"`,
                proposalId,
                metadata: {
                    commentId: comment.id,
                    commenterName: req.user.email || 'Proposal Owner',
                    clientName: proposal.clientName
                }
            });
            return res.status(201).json({
                success: true,
                data: comment,
                message: 'Comment created successfully'
            });
        }
        catch (error) {
            console.error('Create comment error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create comment'
            });
        }
    }
    async updateComment(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;
            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment content is required'
                });
            }
            const existingComment = await database_1.prisma.comment.findFirst({
                where: {
                    id,
                    userId: req.user.userId,
                    organizationId: req.user.organizationId
                }
            });
            if (!existingComment) {
                return res.status(404).json({
                    success: false,
                    error: 'Comment not found or access denied'
                });
            }
            const updatedComment = await database_1.prisma.comment.update({
                where: { id },
                data: {
                    content,
                    updatedAt: new Date()
                }
            });
            return res.json({
                success: true,
                data: updatedComment,
                message: 'Comment updated successfully'
            });
        }
        catch (error) {
            console.error('Update comment error:', error);
            return res.status(500).json({
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