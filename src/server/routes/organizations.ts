import { Router } from 'express';
import { OrganizationController } from '../controllers/organizationController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get brand settings for the current organization
router.get('/brand-settings', authenticateToken, (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  return OrganizationController.getBrandSettings(authenticatedReq, res);
});

// Update brand settings for the current organization
router.put('/brand-settings', authenticateToken, (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  return OrganizationController.updateBrandSettings(authenticatedReq, res);
});

// Get current organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const organization = await OrganizationController.getCurrentOrganization(authenticatedReq, res);
    return organization;
  } catch (error) {
    console.error('Get organization error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch organization' });
  }
});

export default router; 