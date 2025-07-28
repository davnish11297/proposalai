import { Router } from 'express';
import { commentController } from '../controllers/commentController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get comments for a proposal
router.get('/proposal/:proposalId', authenticateToken, (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  return commentController.getComments(authenticatedReq, res);
});

// Get unread count for a proposal
router.get('/proposal/:proposalId/unread', authenticateToken, (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  return commentController.getUnreadCount(authenticatedReq, res);
});

// Create a new comment
router.post('/proposal/:proposalId', authenticateToken, (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  return commentController.createComment(authenticatedReq, res);
});

// Update a comment
router.put('/:id', authenticateToken, (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  return commentController.updateComment(authenticatedReq, res);
});

// Delete a comment
router.delete('/:id', authenticateToken, (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  return commentController.deleteComment(authenticatedReq, res);
});

export default router; 