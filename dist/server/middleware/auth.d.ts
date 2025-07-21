import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/auth';
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload & {
        organizationId?: string;
    };
}
export declare function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(allowedRoles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requireOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map