import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/database';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const snippets = await prisma.snippet.findMany({
      where: {
        organizationId: req.user!.organizationId,
        isActive: true,
      },
      orderBy: { usageCount: 'desc' }
    });

    res.json({
      success: true,
      data: snippets
    });
  } catch (error) {
    console.error('Get snippets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch snippets'
    });
  }
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, content, category, tags } = req.body;

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
        organizationId: req.user!.organizationId!,
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

// Increment usage count when snippet is used
router.post('/:id/increment-usage', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const snippet = await prisma.snippet.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
        isActive: true,
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
        usageCount: {
          increment: 1
        }
      }
    });

    return res.json({
      success: true,
      data: updatedSnippet,
      message: 'Usage count incremented successfully'
    });
  } catch (error) {
    console.error('Increment snippet usage error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to increment usage count'
    });
  }
});

export default router; 