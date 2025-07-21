"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../utils/database");
const router = express_1.default.Router();
function generateAccessCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { accessCode } = req.query;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                organization: {
                    select: {
                        name: true,
                        logo: true,
                        website: true
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
        if (!accessCode) {
            await database_1.prisma.proposal.update({
                where: { id },
                data: {
                    emailOpenedAt: new Date(),
                    emailStatus: 'OPENED'
                }
            });
            return res.json({
                success: true,
                data: {
                    id: proposal.id,
                    title: proposal.title,
                    clientName: proposal.clientName,
                    requiresPassword: true,
                    preview: proposal.content.substring(0, 200) + '...',
                    author: proposal.author,
                    organization: proposal.organization,
                    createdAt: proposal.createdAt
                }
            });
        }
        if (proposal.emailTrackingId !== accessCode) {
            return res.status(401).json({
                success: false,
                error: 'Invalid access code'
            });
        }
        return res.json({
            success: true,
            data: {
                id: proposal.id,
                title: proposal.title,
                content: proposal.content,
                clientName: proposal.clientName,
                author: proposal.author,
                organization: proposal.organization,
                createdAt: proposal.createdAt,
                emailSentAt: proposal.emailSentAt,
                emailRecipient: proposal.emailRecipient
            }
        });
    }
    catch (error) {
        console.error('Public proposal error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch public proposal'
        });
    }
});
router.post('/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        const { accessCode, action, comment } = req.body;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id }
        });
        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }
        if (proposal.emailTrackingId !== accessCode) {
            return res.status(401).json({
                success: false,
                error: 'Invalid access code'
            });
        }
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'IN_REVIEW',
                emailRepliedAt: new Date(),
                emailStatus: 'REPLIED',
                metadata: JSON.stringify({
                    ...JSON.parse(proposal.metadata || '{}'),
                    clientFeedback: {
                        action,
                        comment,
                        submittedAt: new Date().toISOString()
                    }
                })
            }
        });
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
exports.default = router;
//# sourceMappingURL=publicProposals.js.map