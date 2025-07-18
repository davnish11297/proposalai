import { Request, Response } from 'express';
import { prisma as db } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class ClientController {
  // List all clients for the organization
  async getClients(req: AuthenticatedRequest, res: Response) {
    try {
      const clients = await db.client.findMany({
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ success: true, data: clients });
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
      });
      if (!client) {
        res.status(404).json({ success: false, error: 'Client not found' });
        return;
      }
      res.json({ success: true, data: client });
    } catch (error) {
      console.error('Get client error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch client' });
    }
  }

  // Create a new client
  async createClient(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, phone, company, industry, notes } = req.body;
      const client = await db.client.create({
        data: {
          name,
          email,
          phone,
          company,
          industry,
          notes,
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
      const { name, email } = req.body;
      const client = await db.client.update({
        where: { id },
        data: { name, email },
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