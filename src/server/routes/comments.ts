import { Router } from 'express';
import { commentController } from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all comments for a proposal
router.get('/proposal/:proposalId', authenticateToken, (req, res) => commentController.getComments(req, res));

// Create a new comment
router.post('/proposal/:proposalId', authenticateToken, (req, res) => commentController.createComment(req, res));

// Update a comment
router.put('/:id', authenticateToken, (req, res) => commentController.updateComment(req, res));

// Delete a comment
router.delete('/:id', authenticateToken, (req, res) => commentController.deleteComment(req, res));

export default router; 