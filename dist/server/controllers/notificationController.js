"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const database_1 = require("../utils/database");
class NotificationController {
    async getNotifications(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const [notifications, total] = await Promise.all([
                database_1.prisma.notification.findMany({
                    where: {
                        userId: req.user.userId,
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit),
                }),
                database_1.prisma.notification.count({
                    where: {
                        userId: req.user.userId,
                    }
                })
            ]);
            res.json({
                success: true,
                data: notifications,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    }
    async getUnreadCount(req, res) {
        try {
            const unreadCount = await database_1.prisma.notification.count({
                where: {
                    userId: req.user.userId,
                    read: false,
                }
            });
            res.json({
                success: true,
                data: { unreadCount }
            });
        }
        catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch unread count'
            });
        }
    }
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const notification = await database_1.prisma.notification.findFirst({
                where: {
                    id,
                    userId: req.user.userId,
                }
            });
            if (!notification) {
                res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
                return;
            }
            await database_1.prisma.notification.update({
                where: { id },
                data: { read: true }
            });
            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        }
        catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark notification as read'
            });
        }
    }
    async markAllAsRead(req, res) {
        try {
            await database_1.prisma.notification.updateMany({
                where: {
                    userId: req.user.userId,
                    read: false,
                },
                data: { read: true }
            });
            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        }
        catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark notifications as read'
            });
        }
    }
    async getByProposal(req, res) {
        try {
            const { proposalId } = req.params;
            const proposal = await database_1.prisma.proposal.findFirst({
                where: {
                    id: proposalId,
                    organizationId: req.user.organizationId,
                }
            });
            if (!proposal) {
                res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
                return;
            }
            const notifications = await database_1.prisma.notification.findMany({
                where: {
                    userId: req.user.userId,
                    proposalId,
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json({
                success: true,
                data: notifications
            });
        }
        catch (error) {
            console.error('Get proposal notifications error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch proposal notifications'
            });
        }
    }
    async createNotification(data) {
        try {
            return await database_1.prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    message: data.message,
                    proposalId: data.proposalId,
                    read: false,
                }
            });
        }
        catch (error) {
            console.error('Create notification error:', error);
            throw error;
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
//# sourceMappingURL=notificationController.js.map