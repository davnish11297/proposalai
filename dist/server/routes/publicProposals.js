"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const emailService_1 = require("../services/emailService");
const notificationController_1 = require("../controllers/notificationController");
const mongodb_1 = require("mongodb");
const router = (0, express_1.Router)();
function generateAccessCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
async function verifyAccessCode(proposalId, accessCode) {
    const proposal = await database_1.prisma.proposal.findUnique({
        where: { id: proposalId },
        select: { metadata: true }
    });
    if (!proposal || !proposal.metadata) {
        return false;
    }
    try {
        const metadata = JSON.parse(proposal.metadata);
        const accessCodes = metadata.accessCodes || [];
        return accessCodes.includes(accessCode);
    }
    catch (error) {
        console.error('Error parsing proposal metadata:', error);
        return false;
    }
}
async function hasGrantedAccess(proposalId, accessCode) {
    try {
        const accessRequest = await database_1.prisma.accessRequest.findFirst({
            where: {
                proposalId: proposalId,
                accessCode: accessCode,
                status: 'GRANTED'
            }
        });
        return !!accessRequest;
    }
    catch (error) {
        console.error('Error checking granted access:', error);
        return false;
    }
}
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { accessCode } = req.query;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                organization: {
                    select: {
                        name: true,
                        logo: true,
                        primaryColor: true,
                        secondaryColor: true
                    }
                }
            }
        });
        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }
        if (!proposal.isPublic) {
            return res.status(403).json({
                success: false,
                error: 'This proposal is not publicly accessible'
            });
        }
        if (accessCode) {
            const metadata = proposal.metadata;
            const accessCodes = metadata?.accessCodes || [];
            if (!accessCodes.includes(accessCode)) {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid access code'
                });
            }
        }
        await database_1.prisma.activity.create({
            data: {
                type: 'VIEWED',
                details: { accessCode: accessCode || null },
                userId: proposal.userId,
                proposalId: proposal.id,
                organizationId: proposal.organizationId
            }
        });
        return res.json({
            success: true,
            data: {
                ...proposal,
                user: proposal.user,
                organization: proposal.organization
            }
        });
    }
    catch (error) {
        console.error('Get public proposal error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch proposal'
        });
    }
});
router.get('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, error: "Invalid proposal ID" });
        }
        const { accessCode } = req.query;
        if (!accessCode) {
            return res.status(401).json({
                success: false,
                error: 'Access code required'
            });
        }
        const isValidAccessCode = await verifyAccessCode(id, accessCode);
        if (!isValidAccessCode) {
            return res.status(401).json({
                success: false,
                error: 'Invalid access code'
            });
        }
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id }
        });
        if (proposal && (proposal.status === 'APPROVED' || proposal.status === 'REJECTED')) {
            return res.status(403).json({
                success: false,
                error: 'This proposal has already been reviewed and is no longer accessible'
            });
        }
        const comments = await database_1.prisma.comment.findMany({
            where: { proposalId: id },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({
            success: true,
            data: comments
        });
    }
    catch (error) {
        console.error('Public comments error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch comments'
        });
    }
});
router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, error: "Invalid proposal ID" });
        }
        const { accessCode, content, authorName, authorEmail } = req.body;
        if (!accessCode || !content || !authorName || !authorEmail) {
            return res.status(400).json({
                success: false,
                error: 'Access code, content, author name, and email are required'
            });
        }
        const isValidAccessCode = await verifyAccessCode(id, accessCode);
        if (!isValidAccessCode) {
            return res.status(401).json({
                success: false,
                error: 'Invalid access code'
            });
        }
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id }
        });
        if (proposal && (proposal.status === 'APPROVED' || proposal.status === 'REJECTED')) {
            return res.status(403).json({
                success: false,
                error: 'This proposal has already been reviewed and is no longer accessible'
            });
        }
        let user = await database_1.prisma.user.findFirst({
            where: { email: authorEmail }
        });
        if (!user) {
            user = await database_1.prisma.user.create({
                data: {
                    email: authorEmail,
                    name: authorName,
                    password: 'public-user-no-password',
                    isPublicUser: true
                }
            });
        }
        const comment = await database_1.prisma.comment.create({
            data: {
                content: content.trim(),
                authorId: user.id,
                proposalId: id
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
        await database_1.prisma.activity.create({
            data: {
                type: 'COMMENTED',
                message: `Client ${authorName} commented on proposal`,
                userId: user.id,
                proposalId: id,
                details: JSON.stringify({ commentId: comment.id, isPublicComment: true })
            }
        });
        const existingMetadata = proposal.metadata ? JSON.parse(proposal.metadata) : {};
        const lastEmailSent = existingMetadata.lastEmailSent || {};
        const updatedMetadata = {
            ...existingMetadata,
            lastEmailSent: {
                ...lastEmailSent,
                repliedAt: new Date().toISOString(),
                status: 'REPLIED'
            }
        };
        await database_1.prisma.proposal.update({
            where: { id },
            data: {
                metadata: JSON.stringify(updatedMetadata),
                updatedAt: new Date()
            }
        });
        const proposalWithAuthor = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: { author: { select: { email: true, name: true } } }
        });
        try {
            if (proposalWithAuthor && proposalWithAuthor.author && proposalWithAuthor.author.email) {
                await emailService_1.emailService.sendOwnerNotificationEmail({
                    to: proposalWithAuthor.author.email,
                    proposalTitle: proposalWithAuthor.title,
                    proposalId: proposalWithAuthor.id,
                    type: 'comment',
                    clientName: authorName,
                    clientEmail: authorEmail,
                    commentContent: content.trim()
                });
                await notificationController_1.notificationController.createNotification({
                    userId: proposalWithAuthor.authorId,
                    type: 'CLIENT_REPLY',
                    title: 'Client Replied',
                    message: `A client replied to your proposal "${proposalWithAuthor.title}"`,
                    proposalId: proposalWithAuthor.id,
                    metadata: {
                        clientName: authorName,
                        clientEmail: authorEmail,
                        commentContent: content.trim()
                    }
                });
            }
        }
        catch (emailError) {
            console.error('Failed to send owner notification for new comment:', emailError);
        }
        return res.status(201).json({
            success: true,
            data: comment,
            message: 'Comment added successfully'
        });
    }
    catch (error) {
        console.error('Public comment creation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create comment'
        });
    }
});
router.post('/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, error: "Invalid proposal ID" });
        }
        const { accessCode, action, comment } = req.body;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                author: true,
                organization: true
            }
        });
        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }
        const isValidAccessCode = await verifyAccessCode(id, accessCode);
        if (!isValidAccessCode) {
            return res.status(401).json({
                success: false,
                error: 'Invalid access code'
            });
        }
        const existingMetadata = proposal.metadata ? JSON.parse(proposal.metadata) : {};
        const lastEmailSent = existingMetadata.lastEmailSent || {};
        const updatedMetadata = {
            ...existingMetadata,
            lastEmailSent: {
                ...lastEmailSent,
                repliedAt: new Date().toISOString(),
                status: 'REPLIED'
            },
            clientFeedback: {
                action,
                comment,
                submittedAt: new Date().toISOString()
            }
        };
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'IN_REVIEW',
                metadata: JSON.stringify(updatedMetadata),
                updatedAt: new Date()
            }
        });
        try {
            if (proposal.author && proposal.author.email) {
                await emailService_1.emailService.sendOwnerNotificationEmail({
                    to: proposal.author.email,
                    proposalTitle: proposal.title,
                    proposalId: proposal.id,
                    type: action === 'approve' ? 'approved' : 'rejected',
                    clientName: proposal.clientName,
                    clientEmail: lastEmailSent.recipientEmail || 'Unknown',
                    feedbackComment: comment
                });
            }
            await notificationController_1.notificationController.createNotification({
                userId: proposal.authorId,
                type: action === 'approve' ? 'PROPOSAL_APPROVED' : 'PROPOSAL_REJECTED',
                title: action === 'approve' ? 'Proposal Approved!' : 'Proposal Feedback',
                message: action === 'approve'
                    ? `Your proposal "${proposal.title}" was approved by the client!`
                    : `Your proposal "${proposal.title}" received feedback from the client`,
                proposalId: proposal.id,
                metadata: {
                    action,
                    comment,
                    clientName: proposal.clientName,
                    clientEmail: lastEmailSent.recipientEmail || 'Unknown'
                }
            });
        }
        catch (emailError) {
            console.error('Failed to send owner notification for proposal feedback:', emailError);
        }
        return res.json({
            success: true,
            data: updatedProposal,
            message: 'Feedback submitted successfully'
        });
    }
    catch (error) {
        console.error('Client feedback error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
        });
    }
});
router.post('/:id/request-access', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, error: "Invalid proposal ID" });
        }
        const { name, email, company, reason } = req.body;
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Name and email are required'
            });
        }
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                author: true,
                organization: true
            }
        });
        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }
        const accessRequest = await database_1.prisma.accessRequest.create({
            data: {
                name,
                email,
                company: company || null,
                reason: reason || null,
                proposalId: id,
                status: 'PENDING'
            }
        });
        try {
            await emailService_1.emailService.sendAccessRequestEmail({
                to: proposal.author.email,
                proposalTitle: proposal.title,
                requesterName: name,
                requesterEmail: email,
                requesterCompany: company || 'Not specified',
                reason: reason || 'No reason provided',
                proposalId: id
            });
            await notificationController_1.notificationController.createNotification({
                userId: proposal.authorId,
                type: 'ACCESS_REQUEST',
                title: 'New Access Request',
                message: `${name} has requested access to your proposal "${proposal.title}"`,
                proposalId: id,
                metadata: {
                    requesterName: name,
                    requesterEmail: email,
                    requesterCompany: company || 'Not specified',
                    reason: reason || 'No reason provided'
                }
            });
            return res.json({
                success: true,
                message: 'Access request sent successfully'
            });
        }
        catch (emailError) {
            console.error('Failed to send access request email:', emailError);
            return res.status(500).json({
                success: false,
                error: 'Failed to send access request email'
            });
        }
    }
    catch (error) {
        console.error('Access request error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process access request'
        });
    }
});
exports.default = router;
//# sourceMappingURL=publicProposals.js.map