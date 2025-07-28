"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/proposal/:proposalId', auth_1.authenticateToken, (req, res) => {
    const authenticatedReq = req;
    return commentController_1.commentController.getComments(authenticatedReq, res);
});
router.get('/proposal/:proposalId/unread', auth_1.authenticateToken, (req, res) => {
    const authenticatedReq = req;
    return commentController_1.commentController.getUnreadCount(authenticatedReq, res);
});
router.post('/proposal/:proposalId', auth_1.authenticateToken, (req, res) => {
    const authenticatedReq = req;
    return commentController_1.commentController.createComment(authenticatedReq, res);
});
router.put('/:id', auth_1.authenticateToken, (req, res) => {
    const authenticatedReq = req;
    return commentController_1.commentController.updateComment(authenticatedReq, res);
});
router.delete('/:id', auth_1.authenticateToken, (req, res) => {
    const authenticatedReq = req;
    return commentController_1.commentController.deleteComment(authenticatedReq, res);
});
exports.default = router;
//# sourceMappingURL=comments.js.map