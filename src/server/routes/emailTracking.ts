import express from 'express';
import { emailTrackingService } from '../services/emailTrackingService';

const router = express.Router();

// Tracking pixel for email opens
router.get('/track/:trackingId/pixel.png', async (req, res) => {
  const { trackingId } = req.params;
  
  try {
    await emailTrackingService.trackEmailOpen(trackingId);
    
    // Return a 1x1 transparent PNG
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pixel);
  } catch (error) {
    console.error('Email tracking pixel error:', error);
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(pixel);
  }
});

// Track email clicks
router.get('/track/:trackingId/click', async (req, res) => {
  const { trackingId } = req.params;
  const { linkType = 'proposal' } = req.query;
  
  try {
    const result = await emailTrackingService.trackEmailClick(trackingId, linkType as string);
    
    if (result.success && result.proposalId) {
      // Find the proposal to get the access code from metadata
      const { prisma } = require('../utils/database');
      const proposal = await prisma.proposal.findUnique({
        where: { id: result.proposalId },
        select: { metadata: true }
      });
      
      let accessCode = null;
      if (proposal && proposal.metadata) {
        try {
          const metadata = JSON.parse(proposal.metadata);
          const accessCodes = metadata.accessCodes || [];
          // Use the most recent access code (last in the array)
          accessCode = accessCodes[accessCodes.length - 1];
        } catch (error) {
          console.error('Error parsing proposal metadata:', error);
        }
      }
      
      // Redirect to the frontend client with access code
      const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
      if (accessCode) {
        res.redirect(`${clientUrl}/proposal/${result.proposalId}?accessCode=${accessCode}`);
      } else {
        // Fallback to frontend client without access code
        res.redirect(`${clientUrl}/proposal/${result.proposalId}`);
      }
    } else {
      // Fallback redirect to frontend
      const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
      res.redirect(clientUrl);
    }
  } catch (error) {
    console.error('Email click tracking error:', error);
    const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
    res.redirect(clientUrl);
  }
});

// Track email replies (webhook endpoint)
router.post('/track/:trackingId/reply', async (req, res) => {
  const { trackingId } = req.params;
  
  try {
    await emailTrackingService.trackEmailReply(trackingId);
    res.json({ success: true });
  } catch (error) {
    console.error('Email reply tracking error:', error);
    res.status(500).json({ success: false, error: 'Failed to track reply' });
  }
});

// Get email tracking statistics for a proposal
router.get('/stats/:proposalId', async (req, res) => {
  const { proposalId } = req.params;
  
  try {
    const stats = await emailTrackingService.getEmailTrackingStats(proposalId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get email statistics' });
  }
});

export default router; 