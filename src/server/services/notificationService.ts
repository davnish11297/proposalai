import { prisma as db } from '../utils/database';
import { notificationController } from '../controllers/notificationController';

export class NotificationService {
  // Create a notification for proposal opened
  static async notifyProposalOpened(proposalId: string, clientName?: string, clientEmail?: string) {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, title: true, authorId: true, clientName: true, emailRecipient: true }
      });

      if (!proposal) return;

      await notificationController.createNotification({
        userId: proposal.authorId,
        type: 'PROPOSAL_OPENED',
        title: 'Proposal Opened',
        message: `Your proposal "${proposal.title}" was opened by the client`,
        proposalId,
        metadata: {
          clientName: clientName || proposal.clientName,
          clientEmail: clientEmail || proposal.emailRecipient
        }
      });
    } catch (error) {
      console.error('Failed to create proposal opened notification:', error);
    }
  }

  // Create a notification for new client comment
  static async notifyNewClientComment(proposalId: string, commentId: string, clientName: string, commentContent: string) {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, title: true, authorId: true }
      });

      if (!proposal) return;

      await notificationController.createNotification({
        userId: proposal.authorId,
        type: 'COMMENT',
        title: 'New Client Comment',
        message: `A client commented on your proposal "${proposal.title}"`,
        proposalId,
        metadata: {
          commentId,
          clientName,
          commentContent: commentContent.substring(0, 100) + (commentContent.length > 100 ? '...' : '')
        }
      });
    } catch (error) {
      console.error('Failed to create client comment notification:', error);
    }
  }

  // Create a notification for client reply
  static async notifyClientReply(proposalId: string, clientName: string, commentContent: string) {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, title: true, authorId: true }
      });

      if (!proposal) return;

      await notificationController.createNotification({
        userId: proposal.authorId,
        type: 'CLIENT_REPLY',
        title: 'Client Replied',
        message: `A client replied to your proposal "${proposal.title}"`,
        proposalId,
        metadata: {
          clientName,
          commentContent: commentContent.substring(0, 100) + (commentContent.length > 100 ? '...' : '')
        }
      });
    } catch (error) {
      console.error('Failed to create client reply notification:', error);
    }
  }

  // Create a notification for proposal approval
  static async notifyProposalApproved(proposalId: string, clientName?: string, comment?: string) {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, title: true, authorId: true, clientName: true }
      });

      if (!proposal) return;

      await notificationController.createNotification({
        userId: proposal.authorId,
        type: 'PROPOSAL_APPROVED',
        title: 'Proposal Approved!',
        message: `Your proposal "${proposal.title}" was approved by the client!`,
        proposalId,
        metadata: {
          clientName: clientName || proposal.clientName,
          comment
        }
      });
    } catch (error) {
      console.error('Failed to create proposal approved notification:', error);
    }
  }

  // Create a notification for proposal rejection/feedback
  static async notifyProposalFeedback(proposalId: string, action: string, clientName?: string, comment?: string) {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, title: true, authorId: true, clientName: true }
      });

      if (!proposal) return;

      await notificationController.createNotification({
        userId: proposal.authorId,
        type: 'PROPOSAL_REJECTED',
        title: 'Proposal Feedback',
        message: `Your proposal "${proposal.title}" received feedback from the client`,
        proposalId,
        metadata: {
          action,
          clientName: clientName || proposal.clientName,
          comment
        }
      });
    } catch (error) {
      console.error('Failed to create proposal feedback notification:', error);
    }
  }

  // Create a notification for access request
  static async notifyAccessRequest(proposalId: string, requesterName: string, requesterEmail: string, company?: string) {
    try {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, title: true, authorId: true }
      });

      if (!proposal) return;

      await notificationController.createNotification({
        userId: proposal.authorId,
        type: 'ACCESS_REQUEST',
        title: 'New Access Request',
        message: `${requesterName} requested access to your proposal "${proposal.title}"`,
        proposalId,
        metadata: {
          requesterName,
          requesterEmail,
          company
        }
      });
    } catch (error) {
      console.error('Failed to create access request notification:', error);
    }
  }
}

export const notificationService = new NotificationService(); 