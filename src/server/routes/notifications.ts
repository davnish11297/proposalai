import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all notifications for the user
router.get('/', (req, res) => notificationController.getNotifications(req as AuthenticatedRequest, res));

// Get unread count
router.get('/unread-count', (req, res) => notificationController.getUnreadCount(req as AuthenticatedRequest, res));

// Mark notification as read
router.put('/:id/read', (req, res) => notificationController.markAsRead(req as AuthenticatedRequest, res));

// Mark all notifications as read
router.put('/mark-all-read', (req, res) => notificationController.markAllAsRead(req as AuthenticatedRequest, res));

// Get notifications for a specific proposal
router.get('/proposal/:proposalId', (req, res) => notificationController.getByProposal(req as AuthenticatedRequest, res));

export default router; 