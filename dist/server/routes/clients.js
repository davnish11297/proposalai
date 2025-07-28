"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientController_1 = require("../controllers/clientController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, (req, res) => clientController_1.clientController.getClients(req, res));
router.get('/:id', auth_1.authenticateToken, (req, res) => clientController_1.clientController.getClient(req, res));
router.post('/', auth_1.authenticateToken, (req, res) => clientController_1.clientController.createClient(req, res));
router.put('/:id', auth_1.authenticateToken, (req, res) => clientController_1.clientController.updateClient(req, res));
router.delete('/:id', auth_1.authenticateToken, (req, res) => clientController_1.clientController.deleteClient(req, res));
exports.default = router;
//# sourceMappingURL=clients.js.map