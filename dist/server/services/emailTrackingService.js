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
        await database_1.prisma.proposal.update({
            where: { id: proposalId },
            data: {
                ...trackingData,
                emailStatus: 'SENT'
            }
        });
    }
    async trackEmailOpen(trackingId) {
        try {
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { emailTrackingId: trackingId }
            });
            if (!proposal) {
                return { success: false };
            }
            await database_1.prisma.proposal.update({
                where: { id: proposal.id },
                data: {
                    emailOpenedAt: new Date(),
                    emailStatus: 'OPENED'
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
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { emailTrackingId: trackingId }
            });
            if (!proposal) {
                return { success: false };
            }
            await database_1.prisma.proposal.update({
                where: { id: proposal.id },
                data: {
                    emailClickedAt: new Date(),
                    emailStatus: 'CLICKED'
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
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { emailTrackingId: trackingId }
            });
            if (!proposal) {
                return { success: false };
            }
            await database_1.prisma.proposal.update({
                where: { id: proposal.id },
                data: {
                    emailRepliedAt: new Date(),
                    emailStatus: 'REPLIED'
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
        const stats = { ...proposal };
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
    async getOrganizationEmailStats(organizationId) {
        const proposals = await database_1.prisma.proposal.findMany({
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
        const openedProposals = proposals.filter(p => p.emailOpenedAt && p.emailSentAt);
        const repliedProposals = proposals.filter(p => p.emailRepliedAt && p.emailSentAt);
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