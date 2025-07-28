import { Router } from 'express';
import { prisma } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get email tracking data for a proposal
router.get('/proposal/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;

    // Verify the proposal belongs to the user's organization
    const proposal = await prisma.proposal.findFirst({
      where: { 
        id: proposalId,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    // Get email tracking data
    const trackingData = await prisma.emailTracking.findMany({
      where: { proposalId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: trackingData
    });
  } catch (error) {
    console.error('Get email tracking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch email tracking data'
    });
  }
});

// Track email open
router.post('/track-open/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    const tracking = await prisma.emailTracking.findUnique({
      where: { id: trackingId }
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking record not found'
      });
    }

    // Update tracking data
    await prisma.emailTracking.update({
      where: { id: trackingId },
      data: {
        openedAt: new Date(),
        isOpened: true,
        openCount: tracking.openCount + 1
      }
    });

    // Return a 1x1 transparent pixel
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    return res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    console.error('Track email open error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track email open'
    });
  }
});

// Track email click
router.post('/track-click/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.body;

    const tracking = await prisma.emailTracking.findUnique({
      where: { id: trackingId }
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking record not found'
      });
    }

    // Update tracking data
    await prisma.emailTracking.update({
      where: { id: trackingId },
      data: {
        clickedAt: new Date(),
        isClicked: true,
        clickCount: tracking.clickCount + 1,
        lastClickedUrl: url
      }
    });

    // Redirect to the original URL
    return res.redirect(url || '/');
  } catch (error) {
    console.error('Track email click error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track email click'
    });
  }
});

export default router; 