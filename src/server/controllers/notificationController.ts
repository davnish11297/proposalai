import { Response } from 'express';
import { prisma as db } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class NotificationController {
  // Get all notifications for the current user
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [notifications, total] = await Promise.all([
        db.notification.findMany({
          where: {
            userId: req.user!.userId,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        db.notification.count({
          where: {
            userId: req.user!.userId,
          }
        })
      ]);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications'
      });
    }
  }

  // Get unread notification count
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const unreadCount = await db.notification.count({
        where: {
          userId: req.user!.userId,
          read: false,
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

  // Mark notification as read
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const notification = await db.notification.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        }
      });

      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      await db.notification.update({
        where: { id },
        data: { read: true }
      });

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await db.notification.updateMany({
        where: {
          userId: req.user!.userId,
          read: false,
        },
        data: { read: true }
      });

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notifications as read'
      });
    }
  }

  // Get notifications for a specific proposal
  async getByProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;

      // Verify user has access to this proposal
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

      const notifications = await db.notification.findMany({
        where: {
          userId: req.user!.userId,
          proposalId,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Get proposal notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch proposal notifications'
      });
    }
  }

  // Create a notification (internal method)
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    proposalId?: string;
    metadata?: any;
  }) {
    try {
      return await db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          proposalId: data.proposalId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          read: false,
        }
      });
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }
}

export const notificationController = new NotificationController(); 