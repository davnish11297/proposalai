import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { clientController } from '../controllers/clientController';

const router = express.Router();

// List all clients
router.get('/', authenticateToken, (req, res) => clientController.getClients(req, res));

// Get a single client
router.get('/:id', authenticateToken, (req, res) => clientController.getClient(req, res));

// Create a new client
router.post('/', authenticateToken, (req, res) => clientController.createClient(req, res));

// Update a client
router.put('/:id', authenticateToken, (req, res) => clientController.updateClient(req, res));

// Delete a client
router.delete('/:id', authenticateToken, (req, res) => clientController.deleteClient(req, res));

export default router; 