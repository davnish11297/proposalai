"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', (req, res) => notificationController_1.notificationController.getNotifications(req, res));
router.get('/unread-count', (req, res) => notificationController_1.notificationController.getUnreadCount(req, res));
router.put('/:id/read', (req, res) => notificationController_1.notificationController.markAsRead(req, res));
router.put('/mark-all-read', (req, res) => notificationController_1.notificationController.markAllAsRead(req, res));
router.get('/proposal/:proposalId', (req, res) => notificationController_1.notificationController.getByProposal(req, res));
exports.default = router;
//# sourceMappingURL=notifications.js.map