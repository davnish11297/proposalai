import { Router } from 'express';
import { prisma } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all snippets for the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const snippets = await prisma.snippet.findMany({
      where: { organizationId: authenticatedReq.user!.organizationId },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({
      success: true,
      data: snippets
    });
  } catch (error) {
    console.error('Get snippets error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch snippets'
    });
  }
});

// Get a single snippet
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const snippet = await prisma.snippet.findUnique({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!snippet) {
      return res.status(404).json({
        success: false,
        error: 'Snippet not found'
      });
    }

    return res.json({
      success: true,
      data: snippet
    });
  } catch (error) {
    console.error('Get snippet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch snippet'
    });
  }
});

// Create a new snippet
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, content, and category are required'
      });
    }

    const snippet = await prisma.snippet.create({
      data: {
        title,
        content,
        category,
        tags: tags || [],
        organizationId: authenticatedReq.user!.organizationId!
      }
    });

    return res.status(201).json({
      success: true,
      data: snippet,
      message: 'Snippet created successfully'
    });
  } catch (error) {
    console.error('Create snippet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create snippet'
    });
  }
});

// Update a snippet
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;

    const existingSnippet = await prisma.snippet.findFirst({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!existingSnippet) {
      return res.status(404).json({
        success: false,
        error: 'Snippet not found'
      });
    }

    const updatedSnippet = await prisma.snippet.update({
      where: { id },
      data: {
        title,
        content,
        category,
        tags,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      data: updatedSnippet,
      message: 'Snippet updated successfully'
    });
  } catch (error) {
    console.error('Update snippet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update snippet'
    });
  }
});

// Delete a snippet
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;

    const existingSnippet = await prisma.snippet.findFirst({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!existingSnippet) {
      return res.status(404).json({
        success: false,
        error: 'Snippet not found'
      });
    }

    await prisma.snippet.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Snippet deleted successfully'
    });
  } catch (error) {
    console.error('Delete snippet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete snippet'
    });
  }
});

// Increment usage count for a snippet
router.post('/:id/increment-usage', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;

    const snippet = await prisma.snippet.findFirst({
      where: { 
        id,
        organizationId: authenticatedReq.user!.organizationId 
      }
    });

    if (!snippet) {
      return res.status(404).json({
        success: false,
        error: 'Snippet not found'
      });
    }

    const updatedSnippet = await prisma.snippet.update({
      where: { id },
      data: {
        usageCount: snippet.usageCount + 1
      }
    });

    return res.json({
      success: true,
      data: updatedSnippet,
      message: 'Usage count incremented'
    });
  } catch (error) {
    console.error('Increment usage error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to increment usage count'
    });
  }
});

export default router; 