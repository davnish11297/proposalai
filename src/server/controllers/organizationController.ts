import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class OrganizationController {
  static async getBrandSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: req.user!.organizationId }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      return res.json({
        success: true,
        data: {
          primaryColor: organization.primaryColor,
          secondaryColor: organization.secondaryColor,
          fontFamily: organization.fontFamily,
          brandVoice: organization.brandVoice,
          brandGuidelines: organization.brandGuidelines,
          valueProps: organization.valueProps
        }
      });
    } catch (error) {
      console.error('Get brand settings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch brand settings'
      });
    }
  }

  static async updateBrandSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { primaryColor, secondaryColor, fontFamily, brandVoice, brandGuidelines, valueProps } = req.body;

      const organization = await prisma.organization.update({
        where: { id: req.user!.organizationId },
        data: {
          primaryColor,
          secondaryColor,
          fontFamily,
          brandVoice,
          brandGuidelines,
          valueProps
        }
      });

      return res.json({
        success: true,
        data: organization,
        message: 'Brand settings updated successfully'
      });
    } catch (error) {
      console.error('Update brand settings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update brand settings'
      });
    }
  }

  static async getCurrentOrganization(req: AuthenticatedRequest, res: Response) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: req.user!.organizationId }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      return res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Get current organization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization'
      });
    }
  }
} 