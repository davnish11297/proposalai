import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { OrganizationController } from '../controllers/organizationController';

const router = express.Router();

// Get organization brand settings
router.get('/brand-settings', authenticateToken, OrganizationController.getBrandSettings);

// Update organization brand settings
router.put('/brand-settings', authenticateToken, OrganizationController.updateBrandSettings);

router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {},
      message: 'Organizations endpoint - implementation pending'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization'
    });
  }
});

export default router; 