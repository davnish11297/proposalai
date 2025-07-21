import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get all notifications for the current user
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Get notifications for a specific proposal
router.get('/proposal/:proposalId', notificationController.getByProposal);

export default router; 