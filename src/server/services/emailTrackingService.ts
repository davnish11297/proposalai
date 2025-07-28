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
    // Get existing metadata
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      select: { metadata: true }
    });

    const existingMetadata = proposal?.metadata ? JSON.parse(proposal.metadata) : {};
    
    // Update metadata with email tracking data
    const updatedMetadata = {
      ...existingMetadata,
      lastEmailSent: {
        ...existingMetadata.lastEmailSent,
        sentAt: trackingData.emailSentAt?.toISOString(),
        recipientEmail: trackingData.emailRecipient,
        messageId: trackingData.emailMessageId,
        trackingId: trackingData.emailTrackingId,
        status: 'SENT'
      }
    };

    await db.proposal.update({
      where: { id: proposalId },
      data: {
        metadata: JSON.stringify(updatedMetadata),
        updatedAt: new Date()
      }
    });
  }

  // Track email open
  async trackEmailOpen(trackingId: string): Promise<{ success: boolean; proposalId?: string }> {
    try {
      // Find proposal by tracking ID in metadata
      const proposals = await db.proposal.findMany({
        where: { metadata: { not: null } },
        select: { id: true, metadata: true, authorId: true }
      });

      const proposal = proposals.find(p => {
        try {
          const metadata = JSON.parse(p.metadata || '{}');
          return metadata.lastEmailSent?.trackingId === trackingId;
        } catch {
          return false;
        }
      });

      if (!proposal) {
        return { success: false };
      }

      // Update metadata with open tracking
      const existingMetadata = JSON.parse(proposal.metadata || '{}');
      const updatedMetadata = {
        ...existingMetadata,
        lastEmailSent: {
          ...existingMetadata.lastEmailSent,
          openedAt: new Date().toISOString(),
          status: 'OPENED'
        }
      };

      await db.proposal.update({
        where: { id: proposal.id },
        data: {
          metadata: JSON.stringify(updatedMetadata),
          updatedAt: new Date()
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
      // Find proposal by tracking ID in metadata
      const proposals = await db.proposal.findMany({
        where: { metadata: { not: null } },
        select: { id: true, metadata: true, authorId: true }
      });

      const proposal = proposals.find(p => {
        try {
          const metadata = JSON.parse(p.metadata || '{}');
          return metadata.lastEmailSent?.trackingId === trackingId;
        } catch {
          return false;
        }
      });

      if (!proposal) {
        return { success: false };
      }

      // Update metadata with click tracking
      const existingMetadata = JSON.parse(proposal.metadata || '{}');
      const updatedMetadata = {
        ...existingMetadata,
        lastEmailSent: {
          ...existingMetadata.lastEmailSent,
          clickedAt: new Date().toISOString(),
          status: 'CLICKED'
        }
      };

      await db.proposal.update({
        where: { id: proposal.id },
        data: {
          metadata: JSON.stringify(updatedMetadata),
          updatedAt: new Date()
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
      // Find proposal by tracking ID in metadata
      const proposals = await db.proposal.findMany({
        where: { metadata: { not: null } },
        select: { id: true, metadata: true, authorId: true }
      });

      const proposal = proposals.find(p => {
        try {
          const metadata = JSON.parse(p.metadata || '{}');
          return metadata.lastEmailSent?.trackingId === trackingId;
        } catch {
          return false;
        }
      });

      if (!proposal) {
        return { success: false };
      }

      // Update metadata with reply tracking
      const existingMetadata = JSON.parse(proposal.metadata || '{}');
      const updatedMetadata = {
        ...existingMetadata,
        lastEmailSent: {
          ...existingMetadata.lastEmailSent,
          repliedAt: new Date().toISOString(),
          status: 'REPLIED'
        }
      };

      await db.proposal.update({
        where: { id: proposal.id },
        data: {
          metadata: JSON.stringify(updatedMetadata),
          updatedAt: new Date()
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
        metadata: true
      }
    });

    if (!proposal || !proposal.metadata) {
      return {};
    }

    try {
      const metadata = JSON.parse(proposal.metadata);
      const lastEmailSent = metadata.lastEmailSent || {};
      
      const stats = {
        emailSentAt: lastEmailSent.sentAt ? new Date(lastEmailSent.sentAt) : undefined,
        emailRecipient: lastEmailSent.recipientEmail,
        emailOpenedAt: lastEmailSent.openedAt ? new Date(lastEmailSent.openedAt) : undefined,
        emailRepliedAt: lastEmailSent.repliedAt ? new Date(lastEmailSent.repliedAt) : undefined,
        emailClickedAt: lastEmailSent.clickedAt ? new Date(lastEmailSent.clickedAt) : undefined,
        emailStatus: lastEmailSent.status
      };

      // Calculate time differences
      if (stats.emailSentAt) {
        if (stats.emailOpenedAt) {
          (stats as any).timeToOpen = Math.round((stats.emailOpenedAt.getTime() - stats.emailSentAt.getTime()) / (1000 * 60));
        }
        if (stats.emailRepliedAt) {
          (stats as any).timeToReply = Math.round((stats.emailRepliedAt.getTime() - stats.emailSentAt.getTime()) / (1000 * 60));
        }
        if (stats.emailClickedAt) {
          (stats as any).timeToClick = Math.round((stats.emailClickedAt.getTime() - stats.emailSentAt.getTime()) / (1000 * 60));
        }
      }

      return stats;
    } catch (error) {
      console.error('Error parsing proposal metadata for email tracking stats:', error);
      return {};
    }
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
        metadata: { not: null }
      },
      select: {
        metadata: true
      }
    });

    // Parse metadata and extract email tracking data
    const emailTrackingData = proposals
      .map(p => {
        try {
          const metadata = JSON.parse(p.metadata || '{}');
          const lastEmailSent = metadata.lastEmailSent || {};
          return {
            emailSentAt: lastEmailSent.sentAt ? new Date(lastEmailSent.sentAt) : null,
            emailOpenedAt: lastEmailSent.openedAt ? new Date(lastEmailSent.openedAt) : null,
            emailRepliedAt: lastEmailSent.repliedAt ? new Date(lastEmailSent.repliedAt) : null,
            emailClickedAt: lastEmailSent.clickedAt ? new Date(lastEmailSent.clickedAt) : null
          };
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);

    const totalSent = emailTrackingData.filter(p => p && p.emailSentAt).length;
    const totalOpened = emailTrackingData.filter(p => p && p.emailOpenedAt).length;
    const totalReplied = emailTrackingData.filter(p => p && p.emailRepliedAt).length;
    const totalClicked = emailTrackingData.filter(p => p && p.emailClickedAt).length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    // Calculate average times
    const openedProposals = emailTrackingData.filter(p => p && p.emailOpenedAt && p.emailSentAt);
    const repliedProposals = emailTrackingData.filter(p => p && p.emailRepliedAt && p.emailSentAt);

    const averageTimeToOpen = openedProposals.length > 0 
      ? openedProposals.reduce((sum, p) => {
          return sum + (p!.emailOpenedAt!.getTime() - p!.emailSentAt!.getTime()) / (1000 * 60);
        }, 0) / openedProposals.length
      : 0;

    const averageTimeToReply = repliedProposals.length > 0 
      ? repliedProposals.reduce((sum, p) => {
          return sum + (p!.emailRepliedAt!.getTime() - p!.emailSentAt!.getTime()) / (1000 * 60);
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