import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/database';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      where: {
        organizationId: req.user!.organizationId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: caseStudies
    });
  } catch (error) {
    console.error('Get case studies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch case studies'
    });
  }
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, clientName, industry, challenge, solution, results, metrics } = req.body;

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
        clientName: clientName || null,
        industry: industry || null,
        challenge,
        solution,
        results,
        metrics: metrics || null,
        organizationId: req.user!.organizationId!,
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