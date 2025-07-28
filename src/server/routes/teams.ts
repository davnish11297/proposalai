import { Router } from 'express';
import { teamController } from '../controllers/teamController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all teams for the organization
router.get('/', authenticateToken, (req, res) => teamController.getTeams(req as AuthenticatedRequest, res));

// Get a single team
router.get('/:id', authenticateToken, (req, res) => teamController.getTeam(req as AuthenticatedRequest, res));

// Create a new team
router.post('/', authenticateToken, (req, res) => teamController.createTeam(req as AuthenticatedRequest, res));

// Update a team
router.put('/:id', authenticateToken, (req, res) => teamController.updateTeam(req as AuthenticatedRequest, res));

// Delete a team
router.delete('/:id', authenticateToken, (req, res) => teamController.deleteTeam(req as AuthenticatedRequest, res));

// Add a member to a team
router.post('/:teamId/members', authenticateToken, (req, res) => teamController.addTeamMember(req as AuthenticatedRequest, res));

// Update a team member
router.put('/:teamId/members/:memberId', authenticateToken, (req, res) => teamController.updateTeamMember(req as AuthenticatedRequest, res));

// Remove a member from a team
router.delete('/:teamId/members/:memberId', authenticateToken, (req, res) => teamController.removeTeamMember(req as AuthenticatedRequest, res));

// Get proposals for a team
router.get('/:teamId/proposals', authenticateToken, (req, res) => teamController.getTeamProposals(req as AuthenticatedRequest, res));

export default router; 