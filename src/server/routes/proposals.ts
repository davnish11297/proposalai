import { Router } from 'express';
import { proposalController } from '../controllers/proposalController';
import { authenticateToken } from '../middleware/auth';
import express from 'express';
import multer from 'multer';
import { PDFService } from '../services/pdfService';

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

// Extract text from PDF
router.post('/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const extractedText = await pdfService.extractTextFromBuffer(req.file.buffer);
    
    res.json({
      success: true,
      content: extractedText,
      message: 'PDF text extracted successfully'
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract text from PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 