import { Router } from 'express';
import { proposalController } from '../controllers/proposalController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// List all proposals
router.get('/', authenticateToken, (req, res) => proposalController.getProposals(req, res));

// Get a single proposal
router.get('/:id', authenticateToken, (req, res) => proposalController.getProposal(req, res));

// Create a new proposal
router.post('/', authenticateToken, (req, res) => proposalController.createProposal(req, res));

// Update a proposal
router.put('/:id', authenticateToken, (req, res) => proposalController.updateProposal(req, res));

// Delete a proposal
router.delete('/:id', authenticateToken, (req, res) => proposalController.deleteProposal(req, res));

// Generate proposal with AI
router.post('/generate', authenticateToken, (req, res) => proposalController.generateProposal(req, res));

// Publish proposal
router.post('/:id/publish', authenticateToken, (req, res) => proposalController.publishProposal(req, res));

// Duplicate proposal
router.post('/:id/duplicate', authenticateToken, (req, res) => proposalController.duplicateProposal(req, res));

// Get public proposal (no auth)
router.get('/public/:id', (req, res) => proposalController.getPublicProposal(req, res));

// Send proposal via email
router.post('/:id/send-email', authenticateToken, (req, res) => proposalController.sendProposalEmail(req, res));

// Download proposal as PDF
router.get('/:id/download-pdf', authenticateToken, (req, res) => proposalController.downloadPDF(req, res));

export default router; 