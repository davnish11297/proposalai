"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/proposal/:proposalId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { proposalId } = req.params;
        const authenticatedReq = req;
        const proposal = await database_1.prisma.proposal.findFirst({
            where: {
                id: proposalId,
                organizationId: authenticatedReq.user.organizationId
            }
        });
        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }
        const trackingData = await database_1.prisma.emailTracking.findMany({
            where: { proposalId },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({
            success: true,
            data: trackingData
        });
    }
    catch (error) {
        console.error('Get email tracking error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch email tracking data'
        });
    }
});
router.post('/track-open/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;
        const tracking = await database_1.prisma.emailTracking.findUnique({
            where: { id: trackingId }
        });
        if (!tracking) {
            return res.status(404).json({
                success: false,
                error: 'Tracking record not found'
            });
        }
        await database_1.prisma.emailTracking.update({
            where: { id: trackingId },
            data: {
                openedAt: new Date(),
                isOpened: true,
                openCount: tracking.openCount + 1
            }
        });
        res.writeHead(200, { 'Content-Type': 'image/gif' });
        return res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
    catch (error) {
        console.error('Track email open error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to track email open'
        });
    }
});
router.post('/track-click/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { url } = req.body;
        const tracking = await database_1.prisma.emailTracking.findUnique({
            where: { id: trackingId }
        });
        if (!tracking) {
            return res.status(404).json({
                success: false,
                error: 'Tracking record not found'
            });
        }
        await database_1.prisma.emailTracking.update({
            where: { id: trackingId },
            data: {
                clickedAt: new Date(),
                isClicked: true,
                clickCount: tracking.clickCount + 1,
                lastClickedUrl: url
            }
        });
        return res.redirect(url || '/');
    }
    catch (error) {
        console.error('Track email click error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to track email click'
        });
    }
});
exports.default = router;
//# sourceMappingURL=emailTracking.js.map