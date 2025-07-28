import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/auth';
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload & {
        organizationId?: string;
    };
}
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requireOrganization(req: Request, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map