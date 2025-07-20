import { Request, Response } from 'express';
import { prisma as db } from '../utils/database';
import { Prisma } from '@prisma/client';
import { aiService } from '../services/aiService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ICreateProposal, IUpdateProposal, IGenerateProposalRequest } from '../types';
import { generatePublicUrl } from '../utils/auth';
import { pdfService } from '../services/pdfService';
import { emailService } from '../services/emailService';

export class ProposalController {
  // Get all proposals for the organization
  async getProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, type, clientName } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        organizationId: req.user!.organizationId,
      };

      if (status) where.status = status;
      if (type) where.type = type;
      if (clientName) where.clientName = { contains: clientName as string, mode: 'insensitive' };

      const [proposals, total] = await Promise.all([
        db.proposal.findMany({
          where,
          include: {
            author: {
              select: { name: true, email: true }
            },
            _count: {
              select: { comments: true, activities: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        db.proposal.count({ where })
      ]);

      res.json({
        success: true,
        data: proposals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get proposals error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch proposals'
      });
    }
  }

  // Get single proposal
  async getProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const proposal = await db.proposal.findFirst({
        where: {
          id,
          organizationId: req.user!.organizationId,
        },
        include: {
          author: {
            select: { name: true, email: true }
          },
          comments: {
            include: {
              author: {
                select: { name: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          activities: {
            include: {
              user: {
                select: { name: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      // Record view activity
      await db.activity.create({
        data: {
          type: 'VIEWED',
          userId: req.user!.userId,
          proposalId: id,
          details: JSON.stringify({ action: 'viewed' })
        }
      });

      res.json({
        success: true,
        data: proposal
      });
    } catch (error) {
      console.error('Get proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch proposal'
      });
    }
  }

  // Create new proposal
  async createProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const proposalData: ICreateProposal = req.body;

      // Handle client (simplified - no organization-specific client management for now)
      let clientId: string | undefined = undefined;
      if (proposalData.clientName) {
        // For now, just store the client name in the proposal
        // In a future version, we can add organization-specific client management
        clientId = undefined; // We'll store client info in the proposal metadata
      }

      const proposal = await db.proposal.create({
        data: {
          title: proposalData.title ?? 'Untitled Proposal',
          description: proposalData.description ?? undefined,
          clientName: proposalData.clientName,
          type: proposalData.type || 'PROPOSAL',
          content: typeof proposalData.content === 'string' ? proposalData.content : JSON.stringify(proposalData.content || {}),
          metadata: typeof proposalData.metadata === 'string' ? proposalData.metadata : JSON.stringify(proposalData.metadata || {}),
          authorId: req.user!.userId,
          organizationId: req.user!.organizationId!,
          status: proposalData.status || 'DRAFT',
        },
        include: {
          author: {
            select: { name: true, email: true }
          }
        }
      });

      // Record creation activity
      await db.activity.create({
        data: {
          type: 'CREATED',
          userId: req.user!.userId,
          proposalId: proposal.id,
          details: JSON.stringify({ action: 'created' })
        }
      });

      res.status(201).json({
        success: true,
        data: proposal,
        message: 'Proposal created successfully'
      });
    } catch (error) {
      console.error('Create proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create proposal'
      });
    }
  }

  // Update proposal
  async updateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: IUpdateProposal = req.body;

      const existingProposal = await db.proposal.findFirst({
        where: {
          id,
          organizationId: req.user!.organizationId,
        }
      });

      if (!existingProposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      const proposal = await db.proposal.update({
        where: { id },
        data: {
          title: updateData.title ?? undefined,
          description: updateData.description ?? undefined,
          clientName: updateData.clientName,
          status: updateData.status ?? undefined,
          content: typeof updateData.content === 'string' ? updateData.content : JSON.stringify(updateData.content || {}),
          metadata: typeof updateData.metadata === 'string' ? updateData.metadata : JSON.stringify(updateData.metadata || {}),
          version: { increment: 1 }
        },
        include: {
          author: {
            select: { name: true, email: true }
          }
        }
      });

      // Record update activity
      await db.activity.create({
        data: {
          type: 'UPDATED',
          userId: req.user!.userId,
          proposalId: id,
          details: JSON.stringify({ updatedFields: Object.keys(updateData) })
        }
      });

      res.json({
        success: true,
        data: proposal,
        message: 'Proposal updated successfully'
      });
    } catch (error) {
      console.error('Update proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update proposal'
      });
    }
  }

  // Delete proposal
  async deleteProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existingProposal = await db.proposal.findFirst({
        where: {
          id,
          organizationId: req.user!.organizationId,
        }
      });

      if (!existingProposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      // Delete related records first to avoid foreign key constraints
      await db.$transaction([
        // Delete activities
        db.activity.deleteMany({
          where: { proposalId: id }
        }),
        // Delete comments
        db.comment.deleteMany({
          where: { proposalId: id }
        }),
        // Delete the proposal
        db.proposal.delete({
          where: { id }
        })
      ]);

      res.json({
        success: true,
        message: 'Proposal deleted successfully'
      });
    } catch (error) {
      console.error('Delete proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete proposal'
      });
    }
  }

  // Generate proposal with AI
  async generateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request: IGenerateProposalRequest = req.body;

      // Get organization data
      const organization = await db.organization.findUnique({
        where: { id: req.user!.organizationId }
      });

      if (!organization) {
        res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
        return;
      }

      // Handle client (simplified - no organization-specific client management for now)
      let clientId: string | undefined = undefined;
      if (request.clientName) {
        // For now, just store the client name in the proposal
        // In a future version, we can add organization-specific client management
        clientId = undefined; // We'll store client info in the proposal metadata
      }

      // Before passing organization to downstream functions, map only fields that exist on the model
      const processedOrganization = {
        ...organization,
        description: organization.description ?? undefined,
        logo: organization.logo ?? undefined,
        website: organization.website ?? undefined,
        industry: organization.industry ?? undefined,
        brandGuidelines: organization.brandGuidelines ?? undefined,
        size: organization.size ?? undefined,
        valueProps: organization.valueProps ?? undefined,
      };

      // Get relevant data for AI generation (simplified - no organization filtering for now)
      const [snippets, caseStudies, pricingModels] = await Promise.all([
        db.snippet.findMany({
          where: { isActive: true }
        }),
        db.caseStudy.findMany({
          where: { isActive: true }
        }),
        db.pricingModel.findMany({
          where: { isActive: true }
        })
      ]);

      // Generate proposal with AI
      const { content, suggestedSnippets } = await aiService.generateProposal(
        request,
        processedOrganization,
        snippets,
        caseStudies,
        pricingModels
      );

      // Debug: Log the generated content
      console.log('🔍 Generated content type:', typeof content);
      console.log('🔍 Generated content keys:', typeof content === 'object' ? Object.keys(content) : 'not object');
      if (typeof content === 'string') {
        console.log('🔍 Content preview:', content.substring(0, 200));
      }

      // Create the proposal
      // Clean up any Markdown or asterisks from the content before saving
      let cleanContent = content;
      if (typeof cleanContent === 'string') {
        let cleaned = cleanContent
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/\n\s*[-*+]\s/g, '\n- ')
          .replace(/\n\s*\d+\.\s/g, '\n1. ');
        try {
          // Try to parse as JSON first
          cleanContent = JSON.parse(cleaned);
        } catch {
          // If not JSON, wrap as executiveSummary
          cleanContent = {
            executiveSummary: cleaned
          };
        }
      }
      // If still not an object, fallback to template
      if (typeof cleanContent !== 'object' || cleanContent === null) {
        cleanContent = {
          executiveSummary: 'Content could not be parsed. Please regenerate this proposal.',
          approach: 'Content could not be parsed. Please regenerate this proposal.',
          budgetDetails: 'Content could not be parsed. Please regenerate this proposal.',
          timeline: 'Content could not be parsed. Please regenerate this proposal.',
          budget: 'To be discussed'
        };
      }
      const proposal = await db.proposal.create({
        data: {
          title: `Proposal for ${request.clientName}`,
          clientName: request.clientName,
          type: 'PROPOSAL',
          content: JSON.stringify(cleanContent || {}),
          metadata: JSON.stringify({
            generatedWithAI: true,
            generationRequest: request,
            suggestedSnippets: suggestedSnippets.map(s => s.id)
          }),
          authorId: req.user!.userId,
          organizationId: req.user!.organizationId!,
          status: 'DRAFT',
        },
        include: {
          author: {
            select: { name: true, email: true }
          }
        }
      });

      // Record generation activity
      await db.activity.create({
        data: {
          type: 'CREATED',
          userId: req.user!.userId,
          proposalId: proposal.id,
          details: JSON.stringify({ generatedWithAI: true })
        }
      });

      res.status(201).json({
        success: true,
        data: {
          proposal,
          suggestedSnippets,
          estimatedTime: Math.ceil(content.sections?.length * 2) || 10
        },
        message: 'Proposal generated successfully'
      });
    } catch (error) {
      console.error('Generate proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate proposal'
      });
    }
  }

  // Publish proposal (make public)
  async publishProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const proposal = await db.proposal.findFirst({
        where: {
          id,
          organizationId: req.user!.organizationId,
        }
      });

      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      const publicUrl = generatePublicUrl(id);

      const updatedProposal = await db.proposal.update({
        where: { id },
        data: {
          status: 'SENT',
          metadata: JSON.stringify({
            isPublic: true,
            publicUrl,
            publishedAt: new Date().toISOString()
          })
        }
      });

      // Record publish activity
      await db.activity.create({
        data: {
          type: 'PUBLISHED',
          userId: req.user!.userId,
          proposalId: id,
        }
      });

      res.json({
        success: true,
        data: updatedProposal,
        message: 'Proposal published successfully'
      });
    } catch (error) {
      console.error('Publish proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to publish proposal'
      });
    }
  }

  // Get public proposal (no auth required)
  async getPublicProposal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const proposal = await db.proposal.findFirst({
        where: {
          id,
        },
        include: {
          organization: {
            select: { name: true, logo: true, description: true }
          }
        }
      });

      // Check if proposal is public by parsing metadata
      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      try {
        const metadata = proposal.metadata ? JSON.parse(proposal.metadata) : {};
        if (!metadata.isPublic) {
          res.status(404).json({
            success: false,
            error: 'Proposal not found or not public'
          });
          return;
        }
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found or not public'
        });
        return;
      }

      res.json({
        success: true,
        data: proposal
      });
    } catch (error) {
      console.error('Get public proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch proposal'
      });
    }
  }

  // Duplicate proposal
  async duplicateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const originalProposal = await db.proposal.findFirst({
        where: {
          id,
          organizationId: req.user!.organizationId,
        }
      });

      if (!originalProposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
        return;
      }

      const duplicatedProposal = await db.proposal.create({
        data: {
          title: `${originalProposal.title} (Copy)`,
          description: originalProposal.description ?? undefined,
          clientName: originalProposal.clientName,
          type: originalProposal.type,
          content: originalProposal.content === null ? Prisma.JsonNull : originalProposal.content,
          metadata: originalProposal.metadata === null ? Prisma.JsonNull : originalProposal.metadata,
          authorId: req.user!.userId,
          organizationId: req.user!.organizationId!,
          status: 'DRAFT',
        },
        include: {
          author: {
            select: { name: true, email: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: duplicatedProposal,
        message: 'Proposal duplicated successfully'
      });
    } catch (error) {
      console.error('Duplicate proposal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate proposal'
      });
    }
  }

  async sendProposalEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id: proposalId } = req.params;
      const { recipientEmail, customMessage } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!recipientEmail) {
        res.status(400).json({ error: 'Recipient email is required' });
        return;
      }

      // Get the proposal
      const proposal = await db.proposal.findFirst({
        where: {
          id: proposalId,
          organizationId: (req as any).user?.organizationId
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

      if (!proposal) {
        res.status(404).json({ error: 'Proposal not found' });
        return;
      }

      // Generate PDF
      const pdfBuffer = await pdfService.generatePDFBuffer({
        ...proposal,
        clientEmail: proposal.clientName ? `${proposal.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
      } as any);

      // Send email with tracking
      const emailResult = await emailService.sendProposalEmail(
        {
          ...proposal,
          clientEmail: proposal.clientName ? `${proposal.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
        } as any,
        recipientEmail,
        pdfBuffer
      );

      if (!emailResult.success) {
        res.status(500).json({ 
          error: 'Failed to send email',
          details: emailResult.error 
        });
        return;
      }

      // Get existing metadata to preserve access codes
      let existingMetadata = {};
      try {
        existingMetadata = proposal.metadata ? JSON.parse(proposal.metadata) : {};
      } catch (error) {
        existingMetadata = {};
      }

      // Store all access codes in metadata
      const accessCodes = existingMetadata.accessCodes || [];
      accessCodes.push(emailResult.accessCode);

      // Update proposal with tracking information
      await db.proposal.update({
        where: { id: proposalId },
        data: { 
          status: 'SENT',
          emailSentAt: new Date(),
          emailRecipient: recipientEmail,
          emailMessageId: emailResult.messageId,
          emailTrackingId: emailResult.trackingId, // Store the actual tracking ID for email tracking
          metadata: JSON.stringify({
            ...existingMetadata,
            accessCodes: accessCodes,
            lastEmailSent: {
              accessCode: emailResult.accessCode,
              trackingId: emailResult.trackingId,
              sentAt: new Date().toISOString()
            }
          }),
          updatedAt: new Date()
        }
      });

      // Log the activity
      await db.activity.create({
        data: {
          type: 'EMAIL_SENT',
          userId: userId,
          proposalId: proposalId,
          details: JSON.stringify({
            action: 'email_sent',
            recipientEmail,
            messageId: emailResult.messageId,
            trackingId: emailResult.trackingId,
            accessCode: emailResult.accessCode,
            sentAt: new Date().toISOString()
          })
        }
      });

      res.json({
        success: true,
        message: 'Proposal sent successfully',
        messageId: emailResult.messageId,
        trackingId: emailResult.trackingId,
        accessCode: emailResult.accessCode
      });

    } catch (error) {
      console.error('Send proposal email error:', error);
      res.status(500).json({ error: 'Failed to send proposal email' });
    }
  }

  async downloadPDF(req: Request, res: Response): Promise<void> {
    try {
      const { id: proposalId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get the proposal
      const proposal = await db.proposal.findFirst({
        where: {
          id: proposalId,
          organizationId: (req as any).user?.organizationId
        }
      });

      if (!proposal) {
        res.status(404).json({ error: 'Proposal not found' });
        return;
      }

      // Parse content and metadata if they're strings
      let parsedContent = proposal.content;
      let parsedMetadata = proposal.metadata;
      
      try {
        if (typeof proposal.content === 'string') {
          let cleaned = proposal.content
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/\n\s*[-*+]\s/g, '\n- ')
            .replace(/\n\s*\d+\.\s/g, '\n1. ');
          try {
            parsedContent = JSON.parse(cleaned);
          } catch {
            parsedContent = {
              executiveSummary: cleaned
            };
          }
        }
        if (typeof proposal.metadata === 'string') {
          parsedMetadata = JSON.parse(proposal.metadata);
        }
      } catch (error) {
        console.error('Error parsing proposal content/metadata:', error);
        // If parsing still fails, create a fallback content structure
        parsedContent = {
          executiveSummary: 'Content could not be parsed. Please regenerate this proposal.',
          approach: 'Content could not be parsed. Please regenerate this proposal.',
          budgetDetails: 'Content could not be parsed. Please regenerate this proposal.',
          timeline: 'Content could not be parsed. Please regenerate this proposal.',
          budget: 'To be discussed'
        };
        parsedMetadata = {};
      }

      console.log('📄 PDF Generation Debug:', {
        proposalId,
        title: proposal.title,
        contentType: typeof proposal.content,
        contentKeys: typeof parsedContent === 'object' ? Object.keys(parsedContent) : 'not object',
        hasExecutiveSummary: parsedContent?.executiveSummary ? 'yes' : 'no',
        hasApproach: parsedContent?.approach ? 'yes' : 'no',
        hasBudgetDetails: parsedContent?.budgetDetails ? 'yes' : 'no',
        hasTimeline: parsedContent?.timeline ? 'yes' : 'no'
      });

      // Generate PDF
      const pdfBuffer = await pdfService.generatePDFBuffer({
        ...proposal,
        content: parsedContent,
        metadata: parsedMetadata,
        clientEmail: proposal.clientName ? `${proposal.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
      } as any);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send the PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Download PDF error:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
}

export const proposalController = new ProposalController(); 