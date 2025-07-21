import { prisma as db } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

export class EmailTrackingService {
  // Generate a unique tracking ID for emails
  generateTrackingId(): string {
    return uuidv4();
  }

  // Update proposal with email tracking information
  async updateEmailTracking(
    proposalId: string,
    trackingData: {
      emailSentAt?: Date;
      emailRecipient?: string;
      emailMessageId?: string;
      emailTrackingId?: string;
    }
  ): Promise<void> {
    await db.proposal.update({
      where: { id: proposalId },
      data: {
        ...trackingData,
        emailStatus: 'SENT'
      }
    });
  }

  // Track email open
  async trackEmailOpen(trackingId: string): Promise<{ success: boolean; proposalId?: string }> {
    try {
      const proposal = await db.proposal.findUnique({
        where: { emailTrackingId: trackingId }
      });

      if (!proposal) {
        return { success: false };
      }

      await db.proposal.update({
        where: { id: proposal.id },
        data: {
          emailOpenedAt: new Date(),
          emailStatus: 'OPENED'
        }
      });

      // Log activity
      await db.activity.create({
        data: {
          type: 'EMAIL_OPENED',
          userId: proposal.authorId,
          proposalId: proposal.id,
          details: JSON.stringify({ 
            action: 'email_opened',
            openedAt: new Date().toISOString()
          })
        }
      });

      return { success: true, proposalId: proposal.id };
    } catch (error) {
      console.error('Track email open error:', error);
      return { success: false };
    }
  }

  // Track email click
  async trackEmailClick(trackingId: string, linkType: string = 'proposal'): Promise<{ success: boolean; proposalId?: string }> {
    try {
      const proposal = await db.proposal.findUnique({
        where: { emailTrackingId: trackingId }
      });

      if (!proposal) {
        return { success: false };
      }

      await db.proposal.update({
        where: { id: proposal.id },
        data: {
          emailClickedAt: new Date(),
          emailStatus: 'CLICKED'
        }
      });

      // Log activity
      await db.activity.create({
        data: {
          type: 'EMAIL_CLICKED',
          userId: proposal.authorId,
          proposalId: proposal.id,
          details: JSON.stringify({ 
            action: 'email_clicked',
            linkType,
            clickedAt: new Date().toISOString()
          })
        }
      });

      return { success: true, proposalId: proposal.id };
    } catch (error) {
      console.error('Track email click error:', error);
      return { success: false };
    }
  }

  // Track email reply
  async trackEmailReply(trackingId: string): Promise<{ success: boolean; proposalId?: string }> {
    try {
      const proposal = await db.proposal.findUnique({
        where: { emailTrackingId: trackingId }
      });

      if (!proposal) {
        return { success: false };
      }

      await db.proposal.update({
        where: { id: proposal.id },
        data: {
          emailRepliedAt: new Date(),
          emailStatus: 'REPLIED'
        }
      });

      // Log activity
      await db.activity.create({
        data: {
          type: 'EMAIL_REPLIED',
          userId: proposal.authorId,
          proposalId: proposal.id,
          details: JSON.stringify({ 
            action: 'email_replied',
            repliedAt: new Date().toISOString()
          })
        }
      });

      return { success: true, proposalId: proposal.id };
    } catch (error) {
      console.error('Track email reply error:', error);
      return { success: false };
    }
  }

  // Get email tracking statistics for a proposal
  async getEmailTrackingStats(proposalId: string): Promise<{
    emailSentAt?: Date;
    emailRecipient?: string;
    emailOpenedAt?: Date;
    emailRepliedAt?: Date;
    emailClickedAt?: Date;
    emailStatus?: string;
    timeToOpen?: number; // in minutes
    timeToReply?: number; // in minutes
    timeToClick?: number; // in minutes
  }> {
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      select: {
        emailSentAt: true,
        emailRecipient: true,
        emailOpenedAt: true,
        emailRepliedAt: true,
        emailClickedAt: true,
        emailStatus: true
      }
    });

    if (!proposal) {
      return {};
    }

    const stats: any = { ...proposal };

    // Calculate time differences
    if (proposal.emailSentAt) {
      if (proposal.emailOpenedAt) {
        stats.timeToOpen = Math.round((proposal.emailOpenedAt.getTime() - proposal.emailSentAt.getTime()) / (1000 * 60));
      }
      if (proposal.emailRepliedAt) {
        stats.timeToReply = Math.round((proposal.emailRepliedAt.getTime() - proposal.emailSentAt.getTime()) / (1000 * 60));
      }
      if (proposal.emailClickedAt) {
        stats.timeToClick = Math.round((proposal.emailClickedAt.getTime() - proposal.emailSentAt.getTime()) / (1000 * 60));
      }
    }

    return stats;
  }

  // Get email tracking statistics for all proposals in an organization
  async getOrganizationEmailStats(organizationId: string): Promise<{
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    totalClicked: number;
    openRate: number;
    replyRate: number;
    clickRate: number;
    averageTimeToOpen: number;
    averageTimeToReply: number;
  }> {
    const proposals = await db.proposal.findMany({
      where: { 
        organizationId,
        emailSentAt: { not: null }
      },
      select: {
        emailSentAt: true,
        emailOpenedAt: true,
        emailRepliedAt: true,
        emailClickedAt: true
      }
    });

    const totalSent = proposals.length;
    const totalOpened = proposals.filter(p => p.emailOpenedAt).length;
    const totalReplied = proposals.filter(p => p.emailRepliedAt).length;
    const totalClicked = proposals.filter(p => p.emailClickedAt).length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    // Calculate average times
    const openedProposals = proposals.filter(p => p.emailOpenedAt && p.emailSentAt);
    const repliedProposals = proposals.filter(p => p.emailRepliedAt && p.emailSentAt);

    const averageTimeToOpen = openedProposals.length > 0 
      ? openedProposals.reduce((sum, p) => {
          return sum + (p.emailOpenedAt!.getTime() - p.emailSentAt!.getTime()) / (1000 * 60);
        }, 0) / openedProposals.length
      : 0;

    const averageTimeToReply = repliedProposals.length > 0 
      ? repliedProposals.reduce((sum, p) => {
          return sum + (p.emailRepliedAt!.getTime() - p.emailSentAt!.getTime()) / (1000 * 60);
        }, 0) / repliedProposals.length
      : 0;

    return {
      totalSent,
      totalOpened,
      totalReplied,
      totalClicked,
      openRate: Math.round(openRate * 100) / 100,
      replyRate: Math.round(replyRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      averageTimeToOpen: Math.round(averageTimeToOpen),
      averageTimeToReply: Math.round(averageTimeToReply)
    };
  }
}

export const emailTrackingService = new EmailTrackingService(); 