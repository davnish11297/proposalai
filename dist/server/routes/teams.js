"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teamController_1 = require("../controllers/teamController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, (req, res) => teamController_1.teamController.getTeams(req, res));
router.get('/:id', auth_1.authenticateToken, (req, res) => teamController_1.teamController.getTeam(req, res));
router.post('/', auth_1.authenticateToken, (req, res) => teamController_1.teamController.createTeam(req, res));
router.put('/:id', auth_1.authenticateToken, (req, res) => teamController_1.teamController.updateTeam(req, res));
router.delete('/:id', auth_1.authenticateToken, (req, res) => teamController_1.teamController.deleteTeam(req, res));
router.post('/:teamId/members', auth_1.authenticateToken, (req, res) => teamController_1.teamController.addTeamMember(req, res));
router.put('/:teamId/members/:memberId', auth_1.authenticateToken, (req, res) => teamController_1.teamController.updateTeamMember(req, res));
router.delete('/:teamId/members/:memberId', auth_1.authenticateToken, (req, res) => teamController_1.teamController.removeTeamMember(req, res));
router.get('/:teamId/proposals', auth_1.authenticateToken, (req, res) => teamController_1.teamController.getTeamProposals(req, res));
exports.default = router;
//# sourceMappingURL=teams.js.map