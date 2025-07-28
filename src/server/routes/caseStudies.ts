import { Router } from 'express';
import { prisma } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all case studies for the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const caseStudies = await prisma.caseStudy.findMany({
      where: { organizationId: authenticatedReq.user!.organizationId },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({
      success: true,
      data: caseStudies
    });
  } catch (error) {
    console.error('Get case studies error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch case studies'
    });
  }
});

// Get a single case study
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      });
    }

    return res.json({
      success: true,
      data: caseStudy
    });
  } catch (error) {
    console.error('Get case study error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch case study'
    });
  }
});

// Create a new case study
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, clientName, industry, challenge, solution, results, metrics } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;

    if (!title || !description || !challenge || !solution || !results) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, challenge, solution, and results are required'
      });
    }

    const caseStudy = await prisma.caseStudy.create({
      data: {
        title,
        description,
        clientName,
        industry,
        challenge,
        solution,
        results,
        metrics,
        organizationId: authenticatedReq.user!.organizationId!
      }
    });

    return res.status(201).json({
      success: true,
      data: caseStudy,
      message: 'Case study created successfully'
    });
  } catch (error) {
    console.error('Create case study error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create case study'
    });
  }
});

export default router; 