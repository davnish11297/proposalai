"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const database_1 = require("../utils/database");
const notificationController_1 = require("../controllers/notificationController");
class NotificationService {
    static async notifyProposalOpened(proposalId, clientName, clientEmail) {
        try {
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { id: proposalId },
                select: { id: true, title: true, authorId: true, clientName: true, emailRecipient: true }
            });
            if (!proposal)
                return;
            await notificationController_1.notificationController.createNotification({
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
        }
        catch (error) {
            console.error('Failed to create proposal opened notification:', error);
        }
    }
    static async notifyNewClientComment(proposalId, commentId, clientName, commentContent) {
        try {
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { id: proposalId },
                select: { id: true, title: true, authorId: true }
            });
            if (!proposal)
                return;
            await notificationController_1.notificationController.createNotification({
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
        }
        catch (error) {
            console.error('Failed to create client comment notification:', error);
        }
    }
    static async notifyClientReply(proposalId, clientName, commentContent) {
        try {
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { id: proposalId },
                select: { id: true, title: true, authorId: true }
            });
            if (!proposal)
                return;
            await notificationController_1.notificationController.createNotification({
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
        }
        catch (error) {
            console.error('Failed to create client reply notification:', error);
        }
    }
    static async notifyProposalApproved(proposalId, clientName, comment) {
        try {
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { id: proposalId },
                select: { id: true, title: true, authorId: true, clientName: true }
            });
            if (!proposal)
                return;
            await notificationController_1.notificationController.createNotification({
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
        }
        catch (error) {
            console.error('Failed to create proposal approved notification:', error);
        }
    }
    static async notifyProposalFeedback(proposalId, action, clientName, comment) {
        try {
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { id: proposalId },
                select: { id: true, title: true, authorId: true, clientName: true }
            });
            if (!proposal)
                return;
            await notificationController_1.notificationController.createNotification({
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
        }
        catch (error) {
            console.error('Failed to create proposal feedback notification:', error);
        }
    }
    static async notifyAccessRequest(proposalId, requesterName, requesterEmail, company) {
        try {
            const proposal = await database_1.prisma.proposal.findUnique({
                where: { id: proposalId },
                select: { id: true, title: true, authorId: true }
            });
            if (!proposal)
                return;
            await notificationController_1.notificationController.createNotification({
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
        }
        catch (error) {
            console.error('Failed to create access request notification:', error);
        }
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map