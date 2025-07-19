"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/proposal/:proposalId', auth_1.authenticateToken, (req, res) => commentController_1.commentController.getComments(req, res));
router.post('/proposal/:proposalId', auth_1.authenticateToken, (req, res) => commentController_1.commentController.createComment(req, res));
router.put('/:id', auth_1.authenticateToken, (req, res) => commentController_1.commentController.updateComment(req, res));
router.delete('/:id', auth_1.authenticateToken, (req, res) => commentController_1.commentController.deleteComment(req, res));
exports.default = router;
//# sourceMappingURL=comments.js.map