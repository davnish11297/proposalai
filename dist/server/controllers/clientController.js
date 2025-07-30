"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientController = exports.ClientController = void 0;
const database_1 = require("../utils/database");
class ClientController {
    async getClients(req, res) {
        try {
            const clients = await database_1.prisma.client.findMany({
                where: { organizationId: req.user.organizationId },
                orderBy: { createdAt: 'desc' }
            });
            const clientsWithStats = await Promise.all(clients.map(async (client) => {
                const proposals = await database_1.prisma.proposal.findMany({
                    where: { clientName: client.name },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return {
                    ...client,
                    proposals: proposals.map((proposal) => ({
                        id: proposal.id,
                        title: proposal.title,
                        status: proposal.status,
                        createdAt: proposal.createdAt
                    })),
                    totalProposals: proposals.length,
                    activeProposals: proposals.filter((p) => p.status === 'ACTIVE').length
                };
            }));
            res.json({
                success: true,
                data: clientsWithStats
            });
        }
        catch (error) {
            console.error('Get clients error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch clients'
            });
        }
    }
    async getClient(req, res) {
        try {
            const { id } = req.params;
            const client = await database_1.prisma.client.findFirst({
                where: { id }
            });
            if (!client) {
                res.status(404).json({ success: false, error: 'Client not found' });
                return;
            }
            const proposals = await database_1.prisma.proposal.findMany({
                where: { clientName: client.name },
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    type: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    clientName: true,
                    metadata: true
                }
            });
            const transformedClient = {
                ...client,
                proposals: proposals.map((proposal) => {
                    let emailSentAt, emailRecipient;
                    if (proposal.metadata) {
                        try {
                            const metadata = typeof proposal.metadata === 'string'
                                ? JSON.parse(proposal.metadata)
                                : proposal.metadata;
                            if (metadata.lastEmailSent) {
                                emailSentAt = metadata.lastEmailSent.sentAt;
                                emailRecipient = metadata.lastEmailSent.recipientEmail;
                            }
                        }
                        catch (e) {
                        }
                    }
                    return {
                        ...proposal,
                        emailSentAt,
                        emailRecipient
                    };
                })
            };
            res.json({ success: true, data: transformedClient });
        }
        catch (error) {
            console.error('Get client error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch client' });
        }
    }
    async createClient(req, res) {
        try {
            const { name, email, phone, company, notes } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'Client name is required'
                });
            }
            const client = await database_1.prisma.client.create({
                data: {
                    name,
                    email,
                    phone,
                    company,
                    notes,
                    organizationId: req.user.organizationId
                }
            });
            return res.status(201).json({
                success: true,
                data: client,
                message: 'Client created successfully'
            });
        }
        catch (error) {
            console.error('Create client error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create client'
            });
        }
    }
    async updateClient(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, company, industry, notes } = req.body;
            const client = await database_1.prisma.client.update({
                where: { id },
                data: {
                    name,
                    email,
                    phone,
                    company,
                    industry,
                    notes
                },
            });
            res.json({ success: true, data: client, message: 'Client updated successfully' });
        }
        catch (error) {
            console.error('Update client error:', error);
            res.status(500).json({ success: false, error: 'Failed to update client' });
        }
    }
    async deleteClient(req, res) {
        try {
            const { id } = req.params;
            await database_1.prisma.client.delete({ where: { id } });
            res.json({ success: true, message: 'Client deleted successfully' });
        }
        catch (error) {
            console.error('Delete client error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete client' });
        }
    }
}
exports.ClientController = ClientController;
exports.clientController = new ClientController();
//# sourceMappingURL=clientController.js.map