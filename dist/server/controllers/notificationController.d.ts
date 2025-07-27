import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class NotificationController {
    getNotifications(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void>;
    markAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    getByProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    createNotification(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        proposalId?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        type: string;
        createdAt: Date;
        userId: string | null;
        proposalId: string | null;
        message: string;
        read: boolean;
    }>;
}
export declare const notificationController: NotificationController;
//# sourceMappingURL=notificationController.d.ts.map