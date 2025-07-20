import express from 'express';
import { prisma } from '../utils/database';
import { emailService } from '../services/emailService';
import { generateToken } from '../utils/auth';
import { notificationController } from '../controllers/notificationController';

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

// Helper function to verify access code
async function verifyAccessCode(proposalId: string, accessCode: string): Promise<boolean> {
  const proposal = await prisma.proposal.findUnique({
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
  } catch (error) {
    console.error('Error parsing proposal metadata:', error);
    return false;
  }
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
        },
        comments: {
          include: {
            author: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
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

    // Verify access code
    const isValidAccessCode = await verifyAccessCode(id, accessCode as string);
    
    if (!isValidAccessCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access code'
      });
    }

    // Check if proposal has been approved or rejected - if so, invalidate access
    if (proposal.status === 'APPROVED' || proposal.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        error: 'This proposal has already been reviewed and is no longer accessible'
      });
    }

    // Update tracking - proposal opened with valid access code
    if (!proposal.emailOpenedAt) {
      await prisma.proposal.update({
        where: { id },
        data: {
          emailOpenedAt: new Date(),
          emailStatus: 'OPENED'
        }
      });

      // Send notification to proposal owner
      try {
        await emailService.sendOwnerNotificationEmail({
          to: proposal.author.email,
          proposalTitle: proposal.title,
          proposalId: proposal.id,
          type: 'opened',
          clientName: proposal.clientName,
          clientEmail: proposal.emailRecipient
        });

        // Create in-app notification
        await notificationController.createNotification({
          userId: proposal.authorId,
          type: 'PROPOSAL_OPENED',
          title: 'Proposal Opened',
          message: `Your proposal "${proposal.title}" was opened by the client`,
          proposalId: proposal.id,
          metadata: {
            clientName: proposal.clientName,
            clientEmail: proposal.emailRecipient
          }
        });
      } catch (emailError) {
        console.error('Failed to send owner notification for proposal opened:', emailError);
      }
    }

    // Return full proposal content with comments
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
        emailRecipient: proposal.emailRecipient,
        status: proposal.status,
        comments: proposal.comments
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

// Get comments for public proposal
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { accessCode } = req.query;

    if (!accessCode) {
      return res.status(401).json({
        success: false,
        error: 'Access code required'
      });
    }

    // Verify access code
    const isValidAccessCode = await verifyAccessCode(id, accessCode as string);
    
    if (!isValidAccessCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access code'
      });
    }

    // Check if proposal has been approved or rejected - if so, block access
    const proposal = await prisma.proposal.findUnique({
      where: { id }
    });

    if (proposal && (proposal.status === 'APPROVED' || proposal.status === 'REJECTED')) {
      return res.status(403).json({
        success: false,
        error: 'This proposal has already been reviewed and is no longer accessible'
      });
    }

    // Get comments
    const comments = await prisma.comment.findMany({
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
  } catch (error) {
    console.error('Public comments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// Create comment for public proposal
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { accessCode, content, authorName, authorEmail } = req.body;

    if (!accessCode || !content || !authorName || !authorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Access code, content, author name, and email are required'
      });
    }

    // Verify access code
    const isValidAccessCode = await verifyAccessCode(id, accessCode);
    
    if (!isValidAccessCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access code'
      });
    }

    // Check if proposal has been approved or rejected - if so, block access
    const proposal = await prisma.proposal.findUnique({
      where: { id }
    });

    if (proposal && (proposal.status === 'APPROVED' || proposal.status === 'REJECTED')) {
      return res.status(403).json({
        success: false,
        error: 'This proposal has already been reviewed and is no longer accessible'
      });
    }

    // Create a temporary user for the comment or find existing one
    let user = await prisma.user.findFirst({
      where: { email: authorEmail }
    });

    if (!user) {
      // Create a temporary user for public comments
      user = await prisma.user.create({
        data: {
          email: authorEmail,
          name: authorName,
          password: 'public-user-no-password', // Temporary password for public users
          isPublicUser: true // Flag to identify public users
        }
      });
    }

    // Create the comment
    const comment = await prisma.comment.create({
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

    // Record comment activity
    await prisma.activity.create({
      data: {
        type: 'COMMENTED',
        userId: user.id,
        proposalId: id,
        details: JSON.stringify({ commentId: comment.id, isPublicComment: true })
      }
    });

    // Update proposal to set emailRepliedAt and emailStatus
    await prisma.proposal.update({
      where: { id },
      data: {
        emailRepliedAt: new Date(),
        emailStatus: 'REPLIED'
      }
    });

    // Fetch proposal with author for notification
    const proposalWithAuthor = await prisma.proposal.findUnique({
      where: { id },
      include: { author: { select: { email: true, name: true } } }
    });

    // Send notification to proposal owner about new comment
    try {
      if (proposalWithAuthor && proposalWithAuthor.author && proposalWithAuthor.author.email) {
        await emailService.sendOwnerNotificationEmail({
          to: proposalWithAuthor.author.email,
          proposalTitle: proposalWithAuthor.title,
          proposalId: proposalWithAuthor.id,
          type: 'comment',
          clientName: authorName,
          clientEmail: authorEmail,
          commentContent: content.trim()
        });

        // Create in-app notification for client reply
        await notificationController.createNotification({
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
    } catch (emailError) {
      console.error('Failed to send owner notification for new comment:', emailError);
    }

    return res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Public comment creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create comment'
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

    // Verify access code
    const isValidAccessCode = await verifyAccessCode(id, accessCode);
    
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

    // Send notification to proposal owner about approval/rejection
    try {
      await emailService.sendOwnerNotificationEmail({
        to: proposal.author.email,
        proposalTitle: proposal.title,
        proposalId: proposal.id,
        type: action === 'approve' ? 'approved' : 'rejected',
        clientName: proposal.clientName,
        clientEmail: proposal.emailRecipient,
        feedbackComment: comment
      });

      // Create in-app notification
      await notificationController.createNotification({
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
          clientEmail: proposal.emailRecipient
        }
      });
    } catch (emailError) {
      console.error('Failed to send owner notification for proposal feedback:', emailError);
    }

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

// Request access to a proposal
router.post('/:id/request-access', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, company, reason } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    // Find the proposal
    const proposal = await prisma.proposal.findUnique({
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

    // Send email to proposal author
    try {
      await emailService.sendAccessRequestEmail({
        to: proposal.author.email,
        proposalTitle: proposal.title,
        requesterName: name,
        requesterEmail: email,
        requesterCompany: company || 'Not specified',
        reason: reason || 'No reason provided',
        proposalId: id
      });

      return res.json({
        success: true,
        message: 'Access request sent successfully'
      });
    } catch (emailError) {
      console.error('Failed to send access request email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send access request email'
      });
    }
  } catch (error) {
    console.error('Access request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process access request'
    });
  }
});

export default router; 