"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proposalController_1 = require("../controllers/proposalController");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const pdfService_1 = require("../services/pdfService");
const database_1 = __importDefault(require("../utils/database"));
const router = (0, express_1.Router)();
const pdfService = new pdfService_1.PDFService();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});
router.get('/', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.getProposals(req, res));
router.get('/:id', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.getProposal(req, res));
router.post('/', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.createProposal(req, res));
router.put('/:id', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.updateProposal(req, res));
router.delete('/:id', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.deleteProposal(req, res));
router.post('/generate', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.generateProposal(req, res));
router.post('/:id/publish', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.publishProposal(req, res));
router.post('/:id/duplicate', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.duplicateProposal(req, res));
router.get('/public/:id', (req, res) => proposalController_1.proposalController.getPublicProposal(req, res));
router.post('/:id/send-email', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.sendProposalEmail(req, res));
router.get('/:id/download-pdf', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.downloadPDF(req, res));
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
    }
    catch (error) {
        console.error('PDF extraction error:', error);
        return res.status(500).json({
            error: 'Failed to extract text from PDF',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/:id/access-requests', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.getAccessRequests(req, res));
router.post('/:id/access-requests/:requestId/grant', auth_1.authenticateToken, (req, res) => proposalController_1.proposalController.grantAccessRequest(req, res));
router.get('/drafts', async (req, res) => {
    try {
        const drafts = await database_1.default.proposal.findMany({
            where: { status: 'DRAFT' },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: drafts });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch drafts' });
    }
});
exports.default = router;
//# sourceMappingURL=proposals.js.map