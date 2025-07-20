import express from 'express';
import { prisma } from '../utils/database';
import { generateToken } from '../utils/auth';

const router = express.Router();

// Generate a 6-digit alphanumeric password
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get public proposal with password protection
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { accessCode } = req.query;

    // Find the proposal
    const proposal = await prisma.proposal.findUnique({
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

    // If no access code provided, return proposal preview with password prompt
    if (!accessCode) {
      // Update tracking - proposal viewed
      await prisma.proposal.update({
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

    // Verify access code - check historical access codes in metadata
    let isValidAccessCode = false;
    
    if (proposal.metadata) {
      try {
        const metadata = JSON.parse(proposal.metadata);
        const accessCodes = metadata.accessCodes || [];
        isValidAccessCode = accessCodes.includes(accessCode);
      } catch (error) {
        console.error('Error parsing proposal metadata:', error);
      }
    }
    
    if (!isValidAccessCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access code'
      });
    }

    // Return full proposal content
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
  } catch (error) {
    console.error('Public proposal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch public proposal'
    });
  }
});

// Submit client feedback (approve/reject/comment)
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { accessCode, action, comment } = req.body;

    // Find the proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id }
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    // Verify access code - check historical access codes in metadata
    let isValidAccessCode = false;
    
    if (proposal.metadata) {
      try {
        const metadata = JSON.parse(proposal.metadata);
        const accessCodes = metadata.accessCodes || [];
        isValidAccessCode = accessCodes.includes(accessCode);
      } catch (error) {
        console.error('Error parsing proposal metadata:', error);
      }
    }
    
    if (!isValidAccessCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access code'
      });
    }

    // Update proposal with client feedback
    const updatedProposal = await prisma.proposal.update({
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
  } catch (error) {
    console.error('Client feedback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

export default router; 