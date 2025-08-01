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

      if (proposalOwner && proposalOwner.authorId === req.user!.userId) {
        await db.comment.updateMany({
          where: { 
            proposalId,
            isRead: false,
            authorId: { not: req.user!.userId } // Don't mark own comments as read
          },
          data: { isRead: true }
        });
      }

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
      const proposalAccess = await db.proposal.findFirst({
        where: {
          id: proposalId,
          organizationId: req.user!.organizationId,
        }
      });

      if (!proposalAccess) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      const unreadCount = await db.comment.count({
        where: { 
          proposalId,
          isRead: false,
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
  async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const commentData: ICreateComment = req.body;

      // Verify proposal exists and user has access
      const proposalCreate = await db.proposal.findFirst({
        where: {
          id: proposalId,
          organizationId: req.user!.organizationId,
        }
      });

      if (!proposalCreate) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      const comment = await db.comment.create({
        data: {
          content: commentData.content,
          position: commentData.position || null,
          authorId: req.user!.userId,
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

      // Record comment activity
      await db.activity.create({
        data: {
          type: 'COMMENTED',
          userId: req.user!.userId,
          proposalId,
          details: JSON.stringify({ commentId: comment.id })
        }
      });

      // Create notification for proposal owner if comment is from a client
      const proposal = await db.proposal.findFirst({
        where: { id: proposalId },
        include: { author: true }
      });

      if (proposal && proposal.authorId !== req.user!.userId) {
        // This is a client comment, notify the proposal owner
        await notificationController.createNotification({
          userId: proposal.authorId,
          type: 'COMMENT',
          title: 'New Client Comment',
          message: `A client commented on your proposal "${proposal.title}"`,
          proposalId,
          metadata: {
            commentId: comment.id,
            clientName: req.user!.name || req.user!.email
          }
        });
      }

      // Check if this is an owner replying to a client comment
      // Get the proposal and check if there are any public user comments
      const proposalWithComments = await db.proposal.findFirst({
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

      // If there are public user comments and this is the proposal owner, send notification
      if (proposalWithComments && proposalWithComments.comments.length > 0 && proposalWithComments.authorId === req.user!.userId) {
        const latestClientComment = proposalWithComments.comments[0];
        
        // Get access code from proposal metadata
        let accessCode = '';
        try {
          const metadata = proposalWithComments.metadata ? JSON.parse(proposalWithComments.metadata) : {};
          accessCode = metadata.accessCodes?.[0] || '';
        } catch (error) {
          console.error('Error parsing proposal metadata for access code:', error);
        }

        if (accessCode && latestClientComment.author.email) {
          try {
            await emailService.sendClientReplyNotificationEmail({
              to: latestClientComment.author.email,
              proposalTitle: proposalWithComments.title,
              proposalId: proposalWithComments.id,
              ownerName: req.user!.name || 'Proposal Owner',
              replyContent: commentData.content,
              accessCode
            });
          } catch (emailError) {
            console.error('Failed to send client reply notification:', emailError);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment added successfully'
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create comment'
      });
    }
  }

  // Update a comment
  async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: IUpdateComment = req.body;

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

      // Only allow the comment author to edit
      if (existingComment.authorId !== req.user!.userId) {
        res.status(403).json({
          success: false,
          error: 'You can only edit your own comments'
        });
        return;
      }

      const comment = await db.comment.update({
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
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
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