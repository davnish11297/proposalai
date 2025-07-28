import { Router } from 'express';
import { prisma } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all pricing models for the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const pricingModels = await prisma.pricingModel.findMany({
      where: { organizationId: authenticatedReq.user!.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: pricingModels
    });
  } catch (error) {
    console.error('Get pricing models error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing models'
    });
  }
});

// Get a single pricing model
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const pricingModel = await prisma.pricingModel.findUnique({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!pricingModel) {
      return res.status(404).json({
        success: false,
        error: 'Pricing model not found'
      });
    }

    return res.json({
      success: true,
      data: pricingModel
    });
  } catch (error) {
    console.error('Get pricing model error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing model'
    });
  }
});

// Create a new pricing model
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, pricing } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;

    if (!name || !pricing) {
      return res.status(400).json({
        success: false,
        error: 'Name and pricing are required'
      });
    }

    const pricingModel = await prisma.pricingModel.create({
      data: {
        name,
        description,
        pricing,
        organizationId: authenticatedReq.user!.organizationId!
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