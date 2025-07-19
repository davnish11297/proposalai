"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proposalController = exports.ProposalController = void 0;
const database_1 = require("../utils/database");
const client_1 = require("@prisma/client");
const aiService_1 = require("../services/aiService");
const auth_1 = require("../utils/auth");
const pdfService_1 = require("../services/pdfService");
const emailService_1 = require("../services/emailService");
class ProposalController {
    async getProposals(req, res) {
        try {
            const { page = 1, limit = 10, status, type, clientName } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {
                organizationId: req.user.organizationId,
            };
            if (status)
                where.status = status;
            if (type)
                where.type = type;
            if (clientName)
                where.clientName = { contains: clientName, mode: 'insensitive' };
            const [proposals, total] = await Promise.all([
                database_1.prisma.proposal.findMany({
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
                database_1.prisma.proposal.count({ where })
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
        }
        catch (error) {
            console.error('Get proposals error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch proposals'
            });
        }
    }
    async getProposal(req, res) {
        try {
            const { id } = req.params;
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id,
                    organizationId: req.user.organizationId,
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
            await database_1.prisma.activity.create({
                data: {
                    type: 'VIEWED',
                    userId: req.user.userId,
                    proposalId: id,
                    details: JSON.stringify({ action: 'viewed' })
                }
            });
            res.json({
                success: true,
                data: proposal
            });
        }
        catch (error) {
            console.error('Get proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch proposal'
            });
        }
    }
    async createProposal(req, res) {
        try {
            const proposalData = req.body;
            let clientId = undefined;
            if (proposalData.clientName) {
                clientId = undefined;
            }
            const proposal = await database_1.prisma.proposal.create({
                data: {
                    title: proposalData.title ?? 'Untitled Proposal',
                    description: proposalData.description ?? undefined,
                    clientName: proposalData.clientName,
                    type: proposalData.type || 'PROPOSAL',
                    content: typeof proposalData.content === 'string' ? proposalData.content : JSON.stringify(proposalData.content || {}),
                    metadata: typeof proposalData.metadata === 'string' ? proposalData.metadata : JSON.stringify(proposalData.metadata || {}),
                    authorId: req.user.userId,
                    organizationId: req.user.organizationId,
                    status: proposalData.status || 'DRAFT',
                },
                include: {
                    author: {
                        select: { name: true, email: true }
                    }
                }
            });
            await database_1.prisma.activity.create({
                data: {
                    type: 'CREATED',
                    userId: req.user.userId,
                    proposalId: proposal.id,
                    details: JSON.stringify({ action: 'created' })
                }
            });
            res.status(201).json({
                success: true,
                data: proposal,
                message: 'Proposal created successfully'
            });
        }
        catch (error) {
            console.error('Create proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create proposal'
            });
        }
    }
    async updateProposal(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const existingProposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id,
                    organizationId: req.user.organizationId,
                }
            });
            if (!existingProposal) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            const proposal = await database_1.prisma.proposal.update({
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
            await database_1.prisma.activity.create({
                data: {
                    type: 'UPDATED',
                    userId: req.user.userId,
                    proposalId: id,
                    details: JSON.stringify({ updatedFields: Object.keys(updateData) })
                }
            });
            res.json({
                success: true,
                data: proposal,
                message: 'Proposal updated successfully'
            });
        }
        catch (error) {
            console.error('Update proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update proposal'
            });
        }
    }
    async deleteProposal(req, res) {
        try {
            const { id } = req.params;
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id,
                    organizationId: req.user.organizationId,
                }
            });
            if (!proposal) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            await database_1.prisma.proposal.delete({
                where: { id }
            });
            res.json({
                success: true,
                message: 'Proposal deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete proposal'
            });
        }
    }
    async generateProposal(req, res) {
        try {
            const request = req.body;
            const organization = await database_1.prisma.organization.findUnique({
                where: { id: req.user.organizationId }
            });
            if (!organization) {
                res.status(404).json({
                    success: false,
                    error: 'Organization not found'
                });
                return;
            }
            let clientId = undefined;
            if (request.clientName) {
                clientId = undefined;
            }
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
            const [snippets, caseStudies, pricingModels] = await Promise.all([
                database_1.prisma.snippet.findMany({
                    where: { isActive: true }
                }),
                database_1.prisma.caseStudy.findMany({
                    where: { isActive: true }
                }),
                database_1.prisma.pricingModel.findMany({
                    where: { isActive: true }
                })
            ]);
            const { content, suggestedSnippets } = await aiService_1.aiService.generateProposal(request, processedOrganization, snippets, caseStudies, pricingModels);
            console.log('🔍 Generated content type:', typeof content);
            console.log('🔍 Generated content keys:', typeof content === 'object' ? Object.keys(content) : 'not object');
            if (typeof content === 'string') {
                console.log('🔍 Content preview:', content.substring(0, 200));
            }
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
                    cleanContent = JSON.parse(cleaned);
                }
                catch {
                    cleanContent = {
                        executiveSummary: cleaned
                    };
                }
            }
            if (typeof cleanContent !== 'object' || cleanContent === null) {
                cleanContent = {
                    executiveSummary: 'Content could not be parsed. Please regenerate this proposal.',
                    approach: 'Content could not be parsed. Please regenerate this proposal.',
                    budgetDetails: 'Content could not be parsed. Please regenerate this proposal.',
                    timeline: 'Content could not be parsed. Please regenerate this proposal.',
                    budget: 'To be discussed'
                };
            }
            const proposal = await database_1.prisma.proposal.create({
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
                    authorId: req.user.userId,
                    organizationId: req.user.organizationId,
                    status: 'DRAFT',
                },
                include: {
                    author: {
                        select: { name: true, email: true }
                    }
                }
            });
            await database_1.prisma.activity.create({
                data: {
                    type: 'CREATED',
                    userId: req.user.userId,
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
        }
        catch (error) {
            console.error('Generate proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate proposal'
            });
        }
    }
    async publishProposal(req, res) {
        try {
            const { id } = req.params;
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id,
                    organizationId: req.user.organizationId,
                }
            });
            if (!proposal) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            const publicUrl = (0, auth_1.generatePublicUrl)(id);
            const updatedProposal = await database_1.prisma.proposal.update({
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
            await database_1.prisma.activity.create({
                data: {
                    type: 'PUBLISHED',
                    userId: req.user.userId,
                    proposalId: id,
                }
            });
            res.json({
                success: true,
                data: updatedProposal,
                message: 'Proposal published successfully'
            });
        }
        catch (error) {
            console.error('Publish proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to publish proposal'
            });
        }
    }
    async getPublicProposal(req, res) {
        try {
            const { id } = req.params;
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id,
                },
                include: {
                    organization: {
                        select: { name: true, logo: true, description: true }
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
            try {
                const metadata = proposal.metadata ? JSON.parse(proposal.metadata) : {};
                if (!metadata.isPublic) {
                    res.status(404).json({
                        success: false,
                        error: 'Proposal not found or not public'
                    });
                    return;
                }
            }
            catch (error) {
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
        }
        catch (error) {
            console.error('Get public proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch proposal'
            });
        }
    }
    async duplicateProposal(req, res) {
        try {
            const { id } = req.params;
            const originalProposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id,
                    organizationId: req.user.organizationId,
                }
            });
            if (!originalProposal) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            const duplicatedProposal = await database_1.prisma.proposal.create({
                data: {
                    title: `${originalProposal.title} (Copy)`,
                    description: originalProposal.description ?? undefined,
                    clientName: originalProposal.clientName,
                    type: originalProposal.type,
                    content: originalProposal.content === null ? client_1.Prisma.JsonNull : originalProposal.content,
                    metadata: originalProposal.metadata === null ? client_1.Prisma.JsonNull : originalProposal.metadata,
                    authorId: req.user.userId,
                    organizationId: req.user.organizationId,
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
        }
        catch (error) {
            console.error('Duplicate proposal error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to duplicate proposal'
            });
        }
    }
    async sendProposalEmail(req, res) {
        try {
            const { id: proposalId } = req.params;
            const { recipientEmail, customMessage } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            if (!recipientEmail) {
                res.status(400).json({ error: 'Recipient email is required' });
                return;
            }
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id: proposalId,
                    organizationId: req.user?.organizationId
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
            const pdfBuffer = await pdfService_1.pdfService.generatePDFBuffer({
                ...proposal,
                clientEmail: proposal.clientName ? `${proposal.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
            });
            const emailResult = await emailService_1.emailService.sendProposalEmail({
                ...proposal,
                clientEmail: proposal.clientName ? `${proposal.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
            }, recipientEmail, pdfBuffer);
            if (!emailResult.success) {
                res.status(500).json({
                    error: 'Failed to send email',
                    details: emailResult.error
                });
                return;
            }
            await database_1.prisma.activity.create({
                data: {
                    type: 'EMAIL_SENT',
                    userId: userId,
                    proposalId: proposalId,
                    details: `Proposal sent to ${recipientEmail}`
                }
            });
            await database_1.prisma.proposal.update({
                where: { id: proposalId },
                data: {
                    status: 'SENT',
                    updatedAt: new Date()
                }
            });
            res.json({
                success: true,
                message: 'Proposal sent successfully',
                messageId: emailResult.messageId
            });
        }
        catch (error) {
            console.error('Send proposal email error:', error);
            res.status(500).json({ error: 'Failed to send proposal email' });
        }
    }
    async downloadPDF(req, res) {
        try {
            const { id: proposalId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id: proposalId,
                    organizationId: req.user?.organizationId
                }
            });
            if (!proposal) {
                res.status(404).json({ error: 'Proposal not found' });
                return;
            }
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
                    }
                    catch {
                        parsedContent = {
                            executiveSummary: cleaned
                        };
                    }
                }
                if (typeof proposal.metadata === 'string') {
                    parsedMetadata = JSON.parse(proposal.metadata);
                }
            }
            catch (error) {
                console.error('Error parsing proposal content/metadata:', error);
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
            const pdfBuffer = await pdfService_1.pdfService.generatePDFBuffer({
                ...proposal,
                content: parsedContent,
                metadata: parsedMetadata,
                clientEmail: proposal.clientName ? `${proposal.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        }
        catch (error) {
            console.error('Download PDF error:', error);
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    }
}
exports.ProposalController = ProposalController;
exports.proposalController = new ProposalController();
//# sourceMappingURL=proposalController.js.map