import { Router } from 'express';
import { clientController } from '../controllers/clientController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all clients for the organization
router.get('/', authenticateToken, (req, res) => clientController.getClients(req as AuthenticatedRequest, res));

// Get a single client
router.get('/:id', authenticateToken, (req, res) => clientController.getClient(req as AuthenticatedRequest, res));

// Create a new client
router.post('/', authenticateToken, (req, res) => clientController.createClient(req as AuthenticatedRequest, res));

// Update a client
router.put('/:id', authenticateToken, (req, res) => clientController.updateClient(req as AuthenticatedRequest, res));

// Delete a client
router.delete('/:id', authenticateToken, (req, res) => clientController.deleteClient(req as AuthenticatedRequest, res));

export default router; 