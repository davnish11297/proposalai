"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emailTrackingService_1 = require("../services/emailTrackingService");
const router = express_1.default.Router();
router.get('/track/:trackingId/pixel.png', async (req, res) => {
    const { trackingId } = req.params;
    try {
        await emailTrackingService_1.emailTrackingService.trackEmailOpen(trackingId);
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(pixel);
    }
    catch (error) {
        console.error('Email tracking pixel error:', error);
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.send(pixel);
    }
});
router.get('/track/:trackingId/click', async (req, res) => {
    const { trackingId } = req.params;
    const { linkType = 'proposal' } = req.query;
    try {
        const result = await emailTrackingService_1.emailTrackingService.trackEmailClick(trackingId, linkType);
        if (result.success && result.proposalId) {
            const { prisma } = require('../utils/database');
            const proposal = await prisma.proposal.findUnique({
                where: { id: result.proposalId },
                select: { emailTrackingId: true }
            });
            if (proposal && proposal.emailTrackingId) {
                const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
                res.redirect(`${clientUrl}/proposal/${result.proposalId}?accessCode=${proposal.emailTrackingId}`);
            }
            else {
                const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
                res.redirect(`${clientUrl}/proposal/${result.proposalId}`);
            }
        }
        else {
            const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
            res.redirect(clientUrl);
        }
    }
    catch (error) {
        console.error('Email click tracking error:', error);
        const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
        res.redirect(clientUrl);
    }
});
router.post('/track/:trackingId/reply', async (req, res) => {
    const { trackingId } = req.params;
    try {
        await emailTrackingService_1.emailTrackingService.trackEmailReply(trackingId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Email reply tracking error:', error);
        res.status(500).json({ success: false, error: 'Failed to track reply' });
    }
});
router.get('/stats/:proposalId', async (req, res) => {
    const { proposalId } = req.params;
    try {
        const stats = await emailTrackingService_1.emailTrackingService.getEmailTrackingStats(proposalId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        console.error('Get email stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get email statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=emailTracking.js.map