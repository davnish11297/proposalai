import { Router } from 'express';
import { proposalController } from '../controllers/proposalController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import express from 'express';
import multer from 'multer';
import { PDFService } from '../services/pdfService';
import { prisma as db } from '../utils/database';

const router = Router();
const pdfService = new PDFService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// List all proposals
router.get('/', authenticateToken, (req, res) => proposalController.getProposals(req as AuthenticatedRequest, res));

// Get a single proposal
router.get('/:id', authenticateToken, (req, res) => proposalController.getProposal(req as AuthenticatedRequest, res));

// Create a new proposal
router.post('/', authenticateToken, (req, res) => proposalController.createProposal(req as AuthenticatedRequest, res));

// Update a proposal
router.put('/:id', authenticateToken, (req, res) => proposalController.updateProposal(req as AuthenticatedRequest, res));

// Delete a proposal
router.delete('/:id', authenticateToken, (req, res) => proposalController.deleteProposal(req as AuthenticatedRequest, res));

// Generate proposal with AI
router.post('/generate', authenticateToken, (req, res) => proposalController.generateProposal(req as AuthenticatedRequest, res));

// Publish proposal
router.post('/:id/publish', authenticateToken, (req, res) => proposalController.publishProposal(req as AuthenticatedRequest, res));

// Duplicate proposal
router.post('/:id/duplicate', authenticateToken, (req, res) => proposalController.duplicateProposal(req as AuthenticatedRequest, res));

// Get public proposal (no auth)
router.get('/public/:id', (req, res) => proposalController.getPublicProposal(req, res));

// Send proposal via email
router.post('/:id/send-email', authenticateToken, (req, res) => proposalController.sendProposalEmail(req, res));

// Download proposal as PDF
router.get('/:id/download-pdf', authenticateToken, (req, res) => proposalController.downloadPDF(req, res));

// Extract text from PDF
router.post('/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const extractedText = await pdfService.extractTextFromBuffer(req.file.buffer);
    
    return res.json({
      success: true,
      content: extractedText,
      message: 'PDF text extracted successfully'
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return res.status(500).json({
      error: 'Failed to extract text from PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List all access requests for a proposal
router.get('/:id/access-requests', authenticateToken, (req, res) => proposalController.getAccessRequests(req as AuthenticatedRequest, res));
// Grant a pending access request
router.post('/:id/access-requests/:requestId/grant', authenticateToken, (req, res) => proposalController.grantAccessRequest(req as AuthenticatedRequest, res));

// GET /api/proposals/drafts - fetch all draft proposals
router.get('/drafts', async (req, res) => {
  try {
    const drafts = await db.proposal.findMany({
      where: { status: 'DRAFT' },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: drafts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch drafts' });
  }
});

export default router; 