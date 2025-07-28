import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class CommentController {
    getComments(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void>;
    createComment(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateComment(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteComment(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const commentController: CommentController;
//# sourceMappingURL=commentController.d.ts.map