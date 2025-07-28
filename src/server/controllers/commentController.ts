import { Response } from 'express';
import { prisma as db } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { ICreateComment, IUpdateComment } from '../types';
import { emailService } from '../services/emailService';
import { notificationController } from './notificationController';

export class CommentController {
  // Get all comments for a proposal
  async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Verify proposal exists and user has access
      const proposal = await db.proposal.findFirst({
        where: {
          id: proposalId,
          organizationId: req.user!.organizationId,
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
        db.comment.findMany({
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
        db.comment.count({ where: { proposalId } })
      ]);

      // Mark comments as read when proposal owner views them
      const proposalOwner = await db.proposal.findFirst({
        where: { id: proposalId },
        select: { authorId: true }
      });

      // Note: Comment read status is not implemented in the current schema
      // This would require adding an isRead field to the Comment model
      // For now, we'll just return the comments without marking them as read

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
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch comments'
      });
    }
  }

  // Get unread comment count for a proposal
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;

      // Verify proposal exists and user has access
      const proposal = await db.proposal.findFirst({
        where: {
          id: proposalId,
          organizationId: req.user!.organizationId,
        }
      });

      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      // Count comments from other users (not the current user)
      const unreadCount = await db.comment.count({
        where: { 
          proposalId,
          authorId: { not: req.user!.userId } // Don't count own comments
        }
      });

      res.json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch unread count'
      });
    }
  }

  // Create a new comment
  async createComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { proposalId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Comment content is required'
        });
      }

      // Verify proposal exists and belongs to user's organization
      const proposal = await db.proposal.findFirst({
        where: {
          id: proposalId,
          organizationId: req.user!.organizationId
        }
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
      }

      const comment = await db.comment.create({
        data: {
          content,
          userId: req.user!.userId,
          proposalId,
          organizationId: req.user!.organizationId!
        }
      });

      // Create notification for proposal owner
      await notificationController.createNotification({
        userId: proposal.userId,
        type: 'COMMENT_ADDED',
        title: 'New Comment',
        message: `New comment added to proposal "${proposal.title}"`,
        proposalId,
        metadata: {
          commentId: comment.id,
          commenterName: req.user!.email || 'Proposal Owner',
          clientName: proposal.clientName
        }
      });

      return res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment created successfully'
      });
    } catch (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create comment'
      });
    }
  }

  // Update a comment
  async updateComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Comment content is required'
        });
      }

      // Verify comment exists and belongs to user
      const existingComment = await db.comment.findFirst({
        where: {
          id,
          userId: req.user!.userId,
          organizationId: req.user!.organizationId
        }
      });

      if (!existingComment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found or access denied'
        });
      }

      const updatedComment = await db.comment.update({
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
    } catch (error) {
      console.error('Update comment error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update comment'
      });
    }
  }

  // Delete a comment
  async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Find comment and verify ownership
      const existingComment = await db.comment.findFirst({
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

      if (existingComment.proposal.organizationId !== req.user!.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Only allow the comment author or admin to delete
      if (existingComment.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'You can only delete your own comments'
        });
        return;
      }

      await db.comment.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete comment'
      });
    }
  }
}

export const commentController = new CommentController(); 