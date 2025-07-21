import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        organizationId: string;
        email: string;
    };
}
export declare class OrganizationController {
    static getBrandSettings(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateBrandSettings(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=organizationController.d.ts.map