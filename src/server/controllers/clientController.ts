import { Request, Response } from 'express';
import { prisma as db } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class ClientController {
  // List all clients for the organization
  async getClients(req: AuthenticatedRequest, res: Response) {
    try {
      const clients = await db.client.findMany({
        where: { organizationId: req.user!.organizationId },
        orderBy: { createdAt: 'desc' }
      });

      // Fetch proposals for each client separately
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          const proposals = await db.proposal.findMany({
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
            proposals: proposals.map((proposal: any) => ({
              id: proposal.id,
              title: proposal.title,
              status: proposal.status,
              createdAt: proposal.createdAt
            })),
            totalProposals: proposals.length,
            activeProposals: proposals.filter((p: any) => p.status === 'ACTIVE').length
          };
        })
      );

      res.json({
        success: true,
        data: clientsWithStats
      });
    } catch (error) {
      console.error('Get clients error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch clients'
      });
    }
  }

  // Get a single client
  async getClient(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const client = await db.client.findFirst({
        where: { id }
      });
      
      if (!client) {
        res.status(404).json({ success: false, error: 'Client not found' });
        return;
      }

      // Fetch proposals for this client separately
      const proposals = await db.proposal.findMany({
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

      // Transform proposals to include email info from metadata
      const transformedClient = {
        ...client,
        proposals: proposals.map((proposal: any) => {
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
            } catch (e) {
              // Ignore metadata parsing errors
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
    } catch (error) {
      console.error('Get client error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch client' });
    }
  }

  // Create a new client
  async createClient(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, phone, company, notes } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Client name is required'
        });
      }

      const client = await db.client.create({
        data: {
          name,
          email,
          phone,
          company,
          notes,
          organizationId: req.user!.organizationId!
        }
      });

      return res.status(201).json({
        success: true,
        data: client,
        message: 'Client created successfully'
      });
    } catch (error) {
      console.error('Create client error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create client'
      });
    }
  }

  // Update a client
  async updateClient(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, phone, company, industry, notes } = req.body;
      
      const client = await db.client.update({
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
    } catch (error) {
      console.error('Update client error:', error);
      res.status(500).json({ success: false, error: 'Failed to update client' });
    }
  }

  // Delete a client
  async deleteClient(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await db.client.delete({ where: { id } });
      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Delete client error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete client' });
    }
  }
}

export const clientController = new ClientController(); 