import { Router } from 'express';
import { teamController } from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all teams
router.get('/', authenticateToken, (req, res) => teamController.getTeams(req, res));

// Get a single team
router.get('/:id', authenticateToken, (req, res) => teamController.getTeam(req, res));

// Create a new team
router.post('/', authenticateToken, (req, res) => teamController.createTeam(req, res));

// Update a team
router.put('/:id', authenticateToken, (req, res) => teamController.updateTeam(req, res));

// Delete a team
router.delete('/:id', authenticateToken, (req, res) => teamController.deleteTeam(req, res));

// Team member management
router.post('/:teamId/members', authenticateToken, (req, res) => teamController.addTeamMember(req, res));
router.put('/:teamId/members/:memberId', authenticateToken, (req, res) => teamController.updateTeamMember(req, res));
router.delete('/:teamId/members/:memberId', authenticateToken, (req, res) => teamController.removeTeamMember(req, res));

// Get team proposals
router.get('/:teamId/proposals', authenticateToken, (req, res) => teamController.getTeamProposals(req, res));

export default router; 