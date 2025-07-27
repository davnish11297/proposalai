"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTrackingService = exports.EmailTrackingService = void 0;
const database_1 = require("../utils/database");
const uuid_1 = require("uuid");
class EmailTrackingService {
    generateTrackingId() {
        return (0, uuid_1.v4)();
    }
    async updateEmailTracking(proposalId, trackingData) {
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id: proposalId },
            select: { metadata: true }
        });
        const existingMetadata = proposal?.metadata ? JSON.parse(proposal.metadata) : {};
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
        await database_1.prisma.proposal.update({
            where: { id: proposalId },
            data: {
                metadata: JSON.stringify(updatedMetadata),
                updatedAt: new Date()
            }
        });
    }
    async trackEmailOpen(trackingId) {
        try {
            const proposals = await database_1.prisma.proposal.findMany({
                where: { metadata: { not: null } },
                select: { id: true, metadata: true, authorId: true }
            });
            const proposal = proposals.find(p => {
                try {
                    const metadata = JSON.parse(p.metadata || '{}');
                    return metadata.lastEmailSent?.trackingId === trackingId;
                }
                catch {
                    return false;
                }
            });
            if (!proposal) {
                return { success: false };
            }
            const existingMetadata = JSON.parse(proposal.metadata || '{}');
            const updatedMetadata = {
                ...existingMetadata,
                lastEmailSent: {
                    ...existingMetadata.lastEmailSent,
                    openedAt: new Date().toISOString(),
                    status: 'OPENED'
                }
            };
            await database_1.prisma.proposal.update({
                where: { id: proposal.id },
                data: {
                    metadata: JSON.stringify(updatedMetadata),
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.activity.create({
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
        }
        catch (error) {
            console.error('Track email open error:', error);
            return { success: false };
        }
    }
    async trackEmailClick(trackingId, linkType = 'proposal') {
        try {
            const proposals = await database_1.prisma.proposal.findMany({
                where: { metadata: { not: null } },
                select: { id: true, metadata: true, authorId: true }
            });
            const proposal = proposals.find(p => {
                try {
                    const metadata = JSON.parse(p.metadata || '{}');
                    return metadata.lastEmailSent?.trackingId === trackingId;
                }
                catch {
                    return false;
                }
            });
            if (!proposal) {
                return { success: false };
            }
            const existingMetadata = JSON.parse(proposal.metadata || '{}');
            const updatedMetadata = {
                ...existingMetadata,
                lastEmailSent: {
                    ...existingMetadata.lastEmailSent,
                    clickedAt: new Date().toISOString(),
                    status: 'CLICKED'
                }
            };
            await database_1.prisma.proposal.update({
                where: { id: proposal.id },
                data: {
                    metadata: JSON.stringify(updatedMetadata),
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.activity.create({
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
        }
        catch (error) {
            console.error('Track email click error:', error);
            return { success: false };
        }
    }
    async trackEmailReply(trackingId) {
        try {
            const proposals = await database_1.prisma.proposal.findMany({
                where: { metadata: { not: null } },
                select: { id: true, metadata: true, authorId: true }
            });
            const proposal = proposals.find(p => {
                try {
                    const metadata = JSON.parse(p.metadata || '{}');
                    return metadata.lastEmailSent?.trackingId === trackingId;
                }
                catch {
                    return false;
                }
            });
            if (!proposal) {
                return { success: false };
            }
            const existingMetadata = JSON.parse(proposal.metadata || '{}');
            const updatedMetadata = {
                ...existingMetadata,
                lastEmailSent: {
                    ...existingMetadata.lastEmailSent,
                    repliedAt: new Date().toISOString(),
                    status: 'REPLIED'
                }
            };
            await database_1.prisma.proposal.update({
                where: { id: proposal.id },
                data: {
                    metadata: JSON.stringify(updatedMetadata),
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.activity.create({
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
        }
        catch (error) {
            console.error('Track email reply error:', error);
            return { success: false };
        }
    }
    async getEmailTrackingStats(proposalId) {
        const proposal = await database_1.prisma.proposal.findUnique({
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
            if (stats.emailSentAt) {
                if (stats.emailOpenedAt) {
                    stats.timeToOpen = Math.round((stats.emailOpenedAt.getTime() - stats.emailSentAt.getTime()) / (1000 * 60));
                }
                if (stats.emailRepliedAt) {
                    stats.timeToReply = Math.round((stats.emailRepliedAt.getTime() - stats.emailSentAt.getTime()) / (1000 * 60));
                }
                if (stats.emailClickedAt) {
                    stats.timeToClick = Math.round((stats.emailClickedAt.getTime() - stats.emailSentAt.getTime()) / (1000 * 60));
                }
            }
            return stats;
        }
        catch (error) {
            console.error('Error parsing proposal metadata for email tracking stats:', error);
            return {};
        }
    }
    async getOrganizationEmailStats(organizationId) {
        const proposals = await database_1.prisma.proposal.findMany({
            where: {
                organizationId,
                metadata: { not: null }
            },
            select: {
                metadata: true
            }
        });
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
            }
            catch (error) {
                return null;
            }
        })
            .filter(Boolean);
        const totalSent = emailTrackingData.filter(p => p.emailSentAt).length;
        const totalOpened = emailTrackingData.filter(p => p.emailOpenedAt).length;
        const totalReplied = emailTrackingData.filter(p => p.emailRepliedAt).length;
        const totalClicked = emailTrackingData.filter(p => p.emailClickedAt).length;
        const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
        const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
        const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
        const openedProposals = emailTrackingData.filter(p => p.emailOpenedAt && p.emailSentAt);
        const repliedProposals = emailTrackingData.filter(p => p.emailRepliedAt && p.emailSentAt);
        const averageTimeToOpen = openedProposals.length > 0
            ? openedProposals.reduce((sum, p) => {
                return sum + (p.emailOpenedAt.getTime() - p.emailSentAt.getTime()) / (1000 * 60);
            }, 0) / openedProposals.length
            : 0;
        const averageTimeToReply = repliedProposals.length > 0
            ? repliedProposals.reduce((sum, p) => {
                return sum + (p.emailRepliedAt.getTime() - p.emailSentAt.getTime()) / (1000 * 60);
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
exports.EmailTrackingService = EmailTrackingService;
exports.emailTrackingService = new EmailTrackingService();
//# sourceMappingURL=emailTrackingService.js.map