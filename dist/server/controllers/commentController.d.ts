import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class CommentController {
    getComments(req: AuthenticatedRequest, res: Response): Promise<void>;
    createComment(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateComment(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteComment(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const commentController: CommentController;
//# sourceMappingURL=commentController.d.ts.map