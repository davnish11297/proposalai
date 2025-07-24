"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', notificationController_1.notificationController.getNotifications);
router.get('/unread-count', notificationController_1.notificationController.getUnreadCount);
router.put('/:id/read', notificationController_1.notificationController.markAsRead);
router.put('/mark-all-read', notificationController_1.notificationController.markAllAsRead);
router.get('/proposal/:proposalId', notificationController_1.notificationController.getByProposal);
exports.default = router;
//# sourceMappingURL=notifications.js.map