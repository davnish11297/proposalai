import { Request, Response } from 'express';
import { prisma as db } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class ClientController {
  // List all clients for the organization
  async getClients(req: AuthenticatedRequest, res: Response) {
    try {
      const clients = await db.client.findMany({
        where: {
          organizationId: req.user!.organizationId
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          proposals: {
            select: {
              id: true
            }
          }
        }
      });
      
      // Manually calculate proposal counts
      const clientsWithCounts = clients.map(client => ({
        ...client,
        _count: {
          proposals: client.proposals.length
        },
        proposals: undefined // Remove proposals from response to keep it clean
      }));
      
      // Debug: Log the clients and their proposal counts
      console.log('Clients with proposal counts:', clientsWithCounts.map(client => ({
        id: client.id,
        name: client.name,
        proposalCount: client._count.proposals
      })));
      
      res.json({ success: true, data: clientsWithCounts });
    } catch (error) {
      console.error('Get clients error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients' });
    }
  }

  // Get a single client
  async getClient(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const client = await db.client.findFirst({
        where: { id },
        include: {
          proposals: {
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
          }
        }
      });
      
      if (!client) {
        res.status(404).json({ success: false, error: 'Client not found' });
        return;
      }

      // Transform proposals to include email info from metadata
      const transformedClient = {
        ...client,
        proposals: client.proposals.map(proposal => {
          let emailSentAt, emailRecipient;
          if (proposal.metadata) {
            try {
              const metadata = JSON.parse(proposal.metadata);
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
      const { name, email, phone, company, industry, notes } = req.body;
      
      // Check if client already exists in this organization
      const existingClient = await db.client.findFirst({
        where: {
          email: email,
          organizationId: req.user!.organizationId
        }
      });
      
      if (existingClient) {
        return res.status(400).json({ 
          success: false, 
          error: 'Client with this email already exists in your organization' 
        });
      }
      
      const client = await db.client.create({
        data: {
          name,
          email,
          phone,
          company,
          industry,
          notes,
          organizationId: req.user!.organizationId,
        },
      });
      res.status(201).json({ success: true, data: client, message: 'Client created successfully' });
    } catch (error) {
      console.error('Create client error:', error);
      res.status(500).json({ success: false, error: 'Failed to create client' });
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