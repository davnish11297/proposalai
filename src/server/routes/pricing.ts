import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/database';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const pricingModels = await prisma.pricingModel.findMany({
      where: {
        organizationId: req.user!.organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: pricingModels
    });
  } catch (error) {
    console.error('Get pricing models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing models'
    });
  }
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, pricing } = req.body;

    if (!name || !pricing) {
      return res.status(400).json({
        success: false,
        error: 'Name and pricing are required'
      });
    }

    const pricingModel = await prisma.pricingModel.create({
      data: {
        name,
        description: description || null,
        pricing,
        organizationId: req.user!.organizationId!,
      }
    });

    return res.status(201).json({
      success: true,
      data: pricingModel,
      message: 'Pricing model created successfully'
    });
  } catch (error) {
    console.error('Create pricing model error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create pricing model'
    });
  }
});

export default router; 