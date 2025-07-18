import { Request, Response } from 'express';
import { prisma } from '../utils/database';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    email: string;
  };
}

export class OrganizationController {
  // Get organization brand settings
  static async getBrandSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        res.status(401).json({ error: 'Organization not found' });
        return;
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          website: true,
          industry: true,
          size: true,
          primaryColor: true,
          secondaryColor: true,
          fontFamily: true,
          brandVoice: true,
          brandGuidelines: true,
          valueProps: true,
        }
      });

      if (!organization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      res.json(organization);
    } catch (error) {
      console.error('Get brand settings error:', error);
      res.status(500).json({ error: 'Failed to get brand settings' });
    }
  }

  // Update organization brand settings
  static async updateBrandSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        res.status(401).json({ error: 'Organization not found' });
        return;
      }

      const {
        name,
        description,
        logo,
        website,
        industry,
        size,
        primaryColor,
        secondaryColor,
        fontFamily,
        brandVoice,
        brandGuidelines,
        valueProps
      } = req.body;

      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          name,
          description,
          logo,
          website,
          industry,
          size,
          primaryColor,
          secondaryColor,
          fontFamily,
          brandVoice,
          brandGuidelines,
          valueProps
        },
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          website: true,
          industry: true,
          size: true,
          primaryColor: true,
          secondaryColor: true,
          fontFamily: true,
          brandVoice: true,
          brandGuidelines: true,
          valueProps: true,
        }
      });

      res.json(updatedOrganization);
    } catch (error) {
      console.error('Update brand settings error:', error);
      res.status(500).json({ error: 'Failed to update brand settings' });
    }
  }
} 