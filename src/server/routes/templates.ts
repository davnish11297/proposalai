import { Router } from 'express';
import { prisma } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all templates for the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const templates = await prisma.template.findMany({
      where: { organizationId: authenticatedReq.user!.organizationId },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

// Get a single template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const template = await prisma.template.findUnique({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    return res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch template'
    });
  }
});

// Create a new template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, content, isPublic } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;

    if (!name || !category || !content) {
      return res.status(400).json({
        success: false,
        error: 'Name, category, and content are required'
      });
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        content,
        isPublic: isPublic || false,
        organizationId: authenticatedReq.user!.organizationId!
      }
    });

    return res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Create template error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

// Update a template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, content, isPublic } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;

    const existingTemplate = await prisma.template.findFirst({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name,
        description,
        category,
        content,
        isPublic,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Update template error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

// Delete a template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;

    const existingTemplate = await prisma.template.findFirst({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    await prisma.template.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

export default router; 